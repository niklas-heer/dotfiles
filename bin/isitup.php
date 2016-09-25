#!/usr/bin/php
<?php
// @dustyfresh
// 2014
error_reporting(0);
require "vendor/simple_html_dom.php";
$host = $argv[1] or die("Please specify a host to check\n");

function isup($host){
	$html = file_get_html("http://isup.me/$host");
	$data = $html->find('div',0);
	$check = strpos($data,"It's just you.");

	if($check != NULL)
	{
		print "It's just you. $host is up.\n";
	}
	else
	{
		print "It's not just you! $host looks down from here.\n";
	}
}

isup($host);
