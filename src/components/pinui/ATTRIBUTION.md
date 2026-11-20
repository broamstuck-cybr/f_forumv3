# PinUI Component Attribution

The components in this directory are adapted for the F-Forum Quiet-Luxury & Editorial Stone token system from the open-source PinUI registry and blocx library (MIT License, https://www.pinui.xyz):

- `PromptComposer` (`registry/prompt-composer`)
- `LiquidTabs` & `LiquidTabsCard` (`registry/liquid-tabs`)
- `SearchCard` (`registry/search-card`)
- `ThemeSwitch` (`registry/theme-switch`)
- `LampSwitch` (`registry/lamp-switch`)
- `ReaderCard` (`registry/reader-card`)
- `Magnify` (`registry/magnify`)
- `Chips` (`registry/chips`)
- `ChatRoom` (`registry/chat-room`)
- `SelectionList` (`registry/selection-list`)
- `SiteRail` (`components/hero/SiteRail`)
- `TaskCard` (`registry/task-card`)
- `FileBox` (`registry/file-box`)
- `PresenceCards` (`registry/presence-cards`)
- `DynamicDropZone` (`registry/dynamic-drop-zone`)
- `HaloSignIn` (`blocx/halo-sign-in`)
- `SynaisFooter` (`blocx/synais-footer`)

All demo assets, third-party avatar URLs, and Next.js font imports were replaced with native CSS custom properties, inline geometric SVGs, and F-Forum state hooks.

## PinUI catalogue expansion

- Archive `SOURCEOFKNOWLEDGFORAI` at `3f5c676380dffbc4e916ab09be85cb0b4402165f`: 30 components and 11 blocks, including the manifest's published installation commands.
- [Pin UI upstream](https://github.com/shadcn-labs/pin-ui/tree/46b7949cfdec31c0dcb22b4ec453e7c8b4b9544b) adds `SlingSlider.tsx` and `sling-slider.css` under the upstream component MIT terms; see [the included license](PINUI-LICENSE.md). No Pin UI logo, demo media or proprietary branding was imported.
- `/explore?library=pinui` exposes all 42 entries as searchable references. The Sling Slider is an interactive local preview; other entries provide metadata and upstream links. Work receives the references as attached context, not automatically installed or executed code. Real app controls continue to use the adapted PinUI components where appropriate.
