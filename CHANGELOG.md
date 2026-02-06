# Changelog

All notable changes to the IBM Cloud VPC Snapshot Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-06

### Added
- Version display in footer (shows current version number)
- VERSION file in repository root
- GitHub link in footer
- Automated server update script (`update-server.sh`)
- Comprehensive Ubuntu server deployment instructions in README
- Region selector with 9 IBM Cloud regions
- Pricing override capability for custom/updated pricing
- Total snapshots count display (multiplied by number of systems)
- Collapsible calculation details section for traceability
- Region-specific pricing information

### Changed
- **BREAKING**: Corrected calculation logic - all snapshots now charged at delta rate (not first as full copy)
- Updated label from "Total Storage (Snapshots + Base)" to "Snapshot Storage"
- Fixed snapshot count to multiply by number of systems (e.g., 3 systems × 7 snapshots = 21 total)
- Updated pricing assumptions to reflect IBM Cloud's incremental snapshot billing
- Enhanced calculation breakdown with per-system details

### Fixed
- Sass compilation error (wrapped Carbon theme mixin in :root selector)
- Calculation accuracy for multi-system deployments

## [1.0.0] - 2026-02-05

### Added
- Initial release
- Volume configuration (system count and size)
- Change rate selector (Low/Medium/High/Custom)
- Multiple snapshot schedules (Hourly/Daily/Weekly/Monthly)
- Real-time cost calculation
- Per-schedule breakdown
- Monthly and annual cost estimates
- IBM Carbon Design System integration
- Responsive design with dark theme (g100)
- Pricing information and verification links
- Terraform deployment configuration
- Project documentation

[1.1.0]: https://github.com/andygroth/vpc-snapshot-calculator/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/andygroth/vpc-snapshot-calculator/releases/tag/v1.0.0
