package main

/*
#include <libproc.h>
#include <mach/mach.h>
#include <mach/mach_time.h>
#include <stdlib.h>
#include <sys/proc_info.h>
#include <sys/sysctl.h>

static mach_port_t cpuflight_host;

static void cpuflight_init(void) { cpuflight_host = mach_host_self(); }

static int cpuflight_busy_ticks(unsigned long long *busy) {
	host_cpu_load_info_data_t info;
	mach_msg_type_number_t count = HOST_CPU_LOAD_INFO_COUNT;
	if (host_statistics(cpuflight_host, HOST_CPU_LOAD_INFO, (host_info_t)&info, &count) != KERN_SUCCESS) return 1;
	*busy = (unsigned long long)info.cpu_ticks[CPU_STATE_USER]
		+ info.cpu_ticks[CPU_STATE_SYSTEM] + info.cpu_ticks[CPU_STATE_NICE];
	return 0;
}
*/
import "C"

import (
	"errors"
	"fmt"
	"path/filepath"
	"unsafe"

	"golang.org/x/sys/unix"
)

const (
	zombieState   = 5   // SZOMB from sys/proc.h
	tickMS        = 10  // Mach reports CPU load in ticks of 100 Hz
	kinfoHeadroom = 128 // spare slots, because processes appear between sizing and reading
)

// native reads process data straight from the kernel. Its buffers are reused
// so that sampling every two seconds creates almost no garbage.
type native struct {
	procs  []unix.KinfoProc
	args   []byte
	path   []byte
	numer  float64
	denom  float64
	ownUID uint32
}

func newNative() (*native, error) {
	C.cpuflight_init()
	var base C.mach_timebase_info_data_t
	if C.mach_timebase_info(&base) != 0 {
		return nil, errors.New("mach_timebase_info failed")
	}
	argmax, err := unix.SysctlUint32("kern.argmax")
	if err != nil {
		return nil, fmt.Errorf("read kern.argmax: %w", err)
	}
	return &native{
		args:   make([]byte, argmax),
		path:   make([]byte, C.PROC_PIDPATHINFO_MAXSIZE),
		numer:  float64(base.numer),
		denom:  float64(base.denom),
		ownUID: uint32(unix.Getuid()),
	}, nil
}

// list returns every process in the kernel table, including other users'.
// The result is only valid until the next call.
func (n *native) list() ([]unix.KinfoProc, error) {
	mib := [4]C.int{C.CTL_KERN, C.KERN_PROC, C.KERN_PROC_ALL, 0}
	for attempt := 0; attempt < 5; attempt++ {
		if cap(n.procs) == 0 {
			var size C.size_t
			if rc, err := C.sysctl(&mib[0], 4, nil, &size, nil, 0); rc != 0 {
				return nil, fmt.Errorf("size process table: %w", err)
			}
			n.procs = make([]unix.KinfoProc, int(size)/int(unsafe.Sizeof(unix.KinfoProc{}))+kinfoHeadroom)
		}
		n.procs = n.procs[:cap(n.procs)]
		size := C.size_t(uintptr(len(n.procs)) * unsafe.Sizeof(unix.KinfoProc{}))
		rc, err := C.sysctl(&mib[0], 4, unsafe.Pointer(&n.procs[0]), &size, nil, 0)
		if rc == 0 {
			return n.procs[:uintptr(size)/unsafe.Sizeof(unix.KinfoProc{})], nil
		}
		if !errors.Is(err, unix.ENOMEM) {
			return nil, fmt.Errorf("read process table: %w", err)
		}
		n.procs = nil
	}
	return nil, errors.New("process table kept growing while it was read")
}

// arguments reads a process's program path and arguments. The kernel refuses
// this for other users' processes.
func (n *native) arguments(pid int32) (string, []string, bool) {
	mib := [3]C.int{C.CTL_KERN, C.KERN_PROCARGS2, C.int(pid)}
	size := C.size_t(len(n.args))
	if rc, _ := C.sysctl(&mib[0], 3, unsafe.Pointer(&n.args[0]), &size, nil, 0); rc != 0 {
		return "", nil, false
	}
	return parseProcArgs(n.args[:size])
}

// program returns the executable path, which works for every user's process.
func (n *native) program(pid int32) string {
	written := C.proc_pidpath(C.int(pid), unsafe.Pointer(&n.path[0]), C.uint32_t(len(n.path)))
	if written <= 0 {
		return ""
	}
	return string(n.path[:written])
}

// usage returns cumulative CPU seconds and resident KiB. The kernel only
// allows this for the caller's own processes, so false means "ask ps".
func (n *native) usage(pid int32) (float64, int64, bool) {
	var info C.struct_proc_taskinfo
	size := C.int(unsafe.Sizeof(info))
	if C.proc_pidinfo(C.int(pid), C.PROC_PIDTASKINFO, 0, unsafe.Pointer(&info), size) != size {
		return 0, 0, false
	}
	nanos := float64(info.pti_total_user+info.pti_total_system) * n.numer / n.denom
	return nanos / 1e9, int64(info.pti_resident_size) / 1024, true
}

// workingDirectory returns "" when the kernel refuses or the process is gone.
func (n *native) workingDirectory(pid int32) string {
	var info C.struct_proc_vnodepathinfo
	size := C.int(unsafe.Sizeof(info))
	if C.proc_pidinfo(C.int(pid), C.PROC_PIDVNODEPATHINFO, 0, unsafe.Pointer(&info), size) != size {
		return ""
	}
	return C.GoString(&info.pvi_cdir.vip_path[0])
}

// busyMS returns cumulative busy CPU milliseconds across all cores. Unlike a
// sum over processes, it includes processes too brief to be sampled.
func (n *native) busyMS() (uint64, bool) {
	var ticks C.ulonglong
	if C.cpuflight_busy_ticks(&ticks) != 0 {
		return 0, false
	}
	return uint64(ticks) * tickMS, true
}

func swapUsedMB() (int64, bool) {
	var usage C.struct_xsw_usage
	size := C.size_t(unsafe.Sizeof(usage))
	name := C.CString("vm.swapusage")
	defer C.free(unsafe.Pointer(name))
	if rc, _ := C.sysctlbyname(name, unsafe.Pointer(&usage), &size, nil, 0); rc != 0 {
		return 0, false
	}
	return int64(usage.xsu_used) / (1024 * 1024), true
}

func loadAverage() float64 {
	var load [1]C.double
	if C.getloadavg(&load[0], 1) != 1 {
		return 0
	}
	return float64(load[0])
}

// processName prefers the name a process runs under, because agent CLIs are
// versioned files whose path says nothing, such as .../claude/versions/2.1.0.
func processName(argv []string, program, shortName string) string {
	if len(argv) > 0 && argv[0] != "" {
		return filepath.Base(argv[0])
	}
	if program != "" {
		return filepath.Base(program)
	}
	return shortName
}
