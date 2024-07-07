{
    # https://xyno.space/post/nix-darwin-introduction
    description = "nheers Home Manager flake";

    inputs = {
          nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-24.05-darwin";
          home-manager.url = "github:nix-community/home-manager/release-24.05"; # ...
          home-manager.inputs.nixpkgs.follows = "nixpkgs";

          darwin.url = "github:lnl7/nix-darwin";
          darwin.inputs.nixpkgs.follows = "nixpkgs"; # ...
      };

      outputs = { self, nixpkgs, home-manager, darwin }: {

        darwinConfigurations."MacBook-Pro-von-Niklas" = darwin.lib.darwinSystem {
            system = "aarch64-darwin";
            modules = [
                home-manager.darwinModules.home-manager
                ./hosts/MacBook-Pro-von-Niklas/default.nix
            ];
        };
      };
}
