<div align="center">
<h1><a href="https://migo.deno.dev" target="_blank" rel="noopener"><img src="https://icns.ml/deno.svg?stroke=black&stroke-width=0.5&color=white&stroke-linejoin=round" height="24" align="center" alt=""> migo</a><br clear="all"></h1>

_**Generate dynamic OpenGraph images on Deno's Edge Network**_

</div><br />

[![Click here for example OpenGraph Images][example-0]](#examples "Click here for example OpenGraph Images")

---

<br />

<h2><a href="https://vault.dotenv.org/project/vlt_4c5e0ba364799008839e560b596cf80c308e07e07f99a63a6143710ffd7ee75d/example" title="fork with dotenv-vault" target="_blank" rel="noopener"><img src="https://badge.dotenv.org/fork.svg?r=1" alt="Fork with dotenv-vault" align="right"></a>Features </h2>

- [x] Just-in-time rendering with a globally deployed worker on
      [**Deno Deploy**][deno]
- [x] Images cached as immutable assets with [**Cloudflare KV**][kv] for a
      blistering response.
- [x] Rendered as **`.svg`** and rasterized as **`.png`** with
      [**`resvg_wasm`**][resvg]
- [x] Integrated with the whole [**Iconify Collection**][iconify], thanks to
      [**icns.ml**][icns]
- [x] [**Parameters** allow complete control](#parameters) of colors,
      dimensions, icon, and text.
- [ ] `TODO` web form for user-friendly image generation
      ([see Vercel's solution][vercel])

<br />

## Schema

<pre><code>migo.deno.dev/<strong>:title</strong>.(png|svg)?<strong>:params</strong></code></pre>
<pre><code>migo.deno.dev/<strong>:title</strong>/<strong>:subtitle</strong>.(png|svg)?<strong>:params</strong></code></pre>
<pre><code>migo.deno.dev/<strong>:params</strong>/<strong>:title</strong>.(png|svg)</code></pre>
<pre><code>migo.deno.dev/<strong>:params</strong>/<strong>:title</strong>/<strong>:subtitle</strong>.(png|svg)</code></pre>

## Formats

Every image is initially sculpted as an SVG ([Scalable Vector Graphics][svg]),
and you can optionally add the extension **`.svg`** to force that format in the
response.

Unfortunately most social media platforms don't support social images in SVG
format yet, so requests without an `.{svg,png}` extension are redirected to
`.png` prior to rendering.

## Icons

Icons are embedded from [**icns**][icns], another Deno-powered project of mine.
This means direct access to **over 100,000 icons**, and **millions of color
combinations**. A great tool to browse the available icons and make a selection
is [**icones**][icones] by [Anthony Fu][antfu].

To add an icon to an OG image, use the slug (in Iconify format) for the `icon`
param, like so:

> `icon={collection}:{icon}` (e.g. `?icon=tabler:brand-github`).

You can also use an override `iconUrl` parameter, with an encoded URI you'd like
to embed, e.g.:

> `icon=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fremojansen%2Flogo.ts%40master%2Fts.svg`

## Parameters

There are numerous parameters you can use to control the look and feel of the
generated images. Parameters can be provided in either the first part of the
path or in the query string of the URL.

### Path (recommended)

For the best caching potential, I recommend only using the path-style parameters
on your images. Some CDN providers have unexpected caching behavior when assets
have query string parameters in their URI.

<pre><code>migo.deno.dev/<strong>bgColor=white&titleColor=black&icon=typescript</strong>/Title.png</code></pre>

> **Note**: Allowed delimiters are `&` (ampersand), `;` (semi-colon), or `::`.

### Query String

<pre><code>migo.deno.dev/Title.png?<strong>bgColor=white&titleColor=black&icon=typescript</strong></code></pre>

> **Note**: Query string params **must** use the `&` (ampersand) delimiter.

### Default Values

All available parameters and their default value (or formula used to calculate
it):

```jsonc
// root
width = "1280", 
height = "640", 
viewBox = "0 0 {width} {height}", 
pxRatio = "2", // @2x for high-res screens

// icon
icon = "deno", // set to false to disable
iconUrl = "https://icns.ml/{icon}.svg", 

// typography
titleFontSize = "48", 
titleFontFamily = "sans-serif", // "Inter"
titleFontWeight = "bold", 
subtitleFontSize = "32", 
subtitleFontFamily = "monospace", // "JetBrains Mono"
subtitleFontWeight = "normal", 

// dimensions
iconW = "250", 
iconH = "250", // iconW
iconX = "515", // ((width - iconW) / 2)
iconY = "80", 
titleX = "640", // (width / 2)
titleY = "450", // (iconH + iconY + (titleFontSize * 2.5))
subtitleX = "640", // (width / 2)
subtitleY = "530", // (titleY + (subtitleFontSize * 2.5))

// colors
bgColor = "white", 
iconColor = "black", 
titleColor = "#112233", 
titleStroke = "none", 
titleStrokeWidth = "2", 
subtitleColor = "#334455", 
subtitleStroke = "none", 
subtitleStrokeWidth = "2",
```

---

## Performance

The only lag you might encounter is the very first time an image is requested
(this is unavoidable due to the render/raster steps). Thankfully, your users
should essentially never be the ones encountering that lag time; they get a
cache hit from their nearest edge datacenter.

---

## Examples

![Edge-rendered OpenGraph Images on Deno][example-1]

![Creating Dynamic Social Cover Images][example-2]

![Nuxt Content Wind Starter][example-3]

![Deno Module Starter][example-4]

---

<div align="center">

MIT © [Nicholas Berlette][nberlette]

</div>

[nberlette]: https://github.com/nberlette "Nicholas Berlette"
[icns]: https://icns.ml "icns - SVG as a Service"
[antfu]: https://github.com/antfu "Anthony Fu"
[icones]: https://icones.js.org "Browse every Iconify Collection with Icones"
[vercel]: https://og-image.vercel.app "Vercel's OG Image App"
[iconify]: https://iconify.design "Iconify Project Homepage"
[kv]: https://developers.cloudflare.com/workers/runtime-apis/kv "Cloudflare KV"
[svg]: https://w3.org/TR/SVG "SVG Specification from W3.org"
[resvg]: https://deno.land/x/resvg_wasm "Resvg Wasm"
[deno]: https://deno.com/deploy "Deno Deploy"
[deploy]: https://dash.deno.com/new?url=https%3a%2f%2fgithub.com%2fnberlette%2fmigo%2fraw%2fmain%2fmain.tsx "Deploy with Deno!"
[examples-splash]: https://migo.deno.dev/image.png?icon=deno&iconStrokeWidth=0.33&subtitleFontSize=48&iconColor=fff&bgColor=234&iconStroke=fff&titleColor=fff&subtitleColor=999&titleY=425&subtitleFontSize=36&title=Click%20here%20for%20example%20OG%20Images&subtitle=(or%20scroll%20down)&pxRatio=1.5&borderRadius=25
[example-0]: https://migo.deno.dev/image.png?title=migo.deno.dev&subtitle=Dynamic+OpenGraph+Images+on+Deno+Deploy&titleFontFamily=serif&titleFontSize=72&titleFontWeight=900&titleTextAnchor=left&titleX=160&titleY=110&subtitleFontSize=36&subtitleFontWeight=900&subtitleFontFamily=monospace&subtitleTextAnchor=left&subtitleX=40&subtitleY=250&pxRatio=1.5&width=1000&height=300&bgColor=111827&titleColor=fff&subtitleColor=ddd&icon=noto:t-rex&iconW=100&iconH=100&iconX=40&iconY=30&borderRadius=20
[example-1]: https://migo.deno.dev/image.png?icon=deno&iconStrokeWidth=0.33&subtitleFontSize=48&iconColor=fff&bgColor=234&iconStroke=fff&titleColor=fff&subtitleColor=papayawhip&titleY=425&subtitleFontSize=48&title=Edge-rendered%20OpenGraph%20Images&subtitle=migo.deno.dev&pxRatio=1.5&borderRadius=25&titleFontFamily=sans-serif
[example-2]: https://migo.deno.dev/image.png?icon=twitter&subtitleFontSize=48&iconColor=0cf&titleY=460&subtitleFontSize=48&title=Creating%20Dynamic%20Cover%20Images&subtitle=By%20Nicholas%20Berlette&borderRadius=25&titleFontFamily=monospace
[example-3]: https://migo.deno.dev/image.png?icon=nuxtdotjs&bgColor=112233&iconColor=00DC82&iconStroke=00DC82&iconStrokeWidth=0.55&titleColor=00DC82&subtitleColor=e0e0e0&iconW=300&iconY=50&titleY=460&title=Nuxt%20ContentWind%20Starter&subtitle=stackblitz.com%2fedit%2fcontent-wind&borderRadius=30&pxRatio=1.5
[example-4]: https://migo.deno.dev/image.png?title=deno911⁄+kit&subtitle=this+one+has+custom+alignment+and+size!&titleFontFamily=sans-serif&titleFontSize=80&titleFontWeight=900&titleTextAnchor=right&titleX=160&titleY=115&subtitleFontSize=36&subtitleFontWeight=900&subtitleFontFamily=monospace&subtitleTextAnchor=left&subtitleX=40&subtitleY=260&pxRatio=1.5&width=1000&height=300&bgColor=fff&titleColor=123&subtitleColor=456&icon=noto:sauropod&iconW=100&iconH=100&iconX=40&iconY=30&borderRadius=20

