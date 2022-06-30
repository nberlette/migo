<div align="center">
<h1><a href="https://migo.deno.dev" target="_blank" rel="noopener"><img src="https://icns.ml/mdi:alpha-m-circle:white.svg?stroke=black&stroke-width=0.8&stroke-linejoin=round" width="44" align="left" alt=""><code>migo.deno.dev</code><img src="https://icns.ml/mdi:alpha-o-circle:white.svg?stroke=black&stroke-width=0.8&stroke-linejoin=round" width="44" align="right" alt=""></a><br clear="all"></h1>

**Generate just-in-time dynamic OpenGraph images on The Edge**
</div>

---  

## Summary

- [x] Generated just-in-time on an endpoint that's globally deployed via [**Deno's Edge Network**][deno].
- [x] Cached as immutable assets, and replicated with [**Cloudflare KV**][kv] - allowing blistering fast response times. 
- [x] Rendered as **`.svg`**, then rasterized into **`.png`** with [**`resvg`**][resvg], a renderer written in Rust.
- [x] Integrated with the whole [**Iconify Collection**](https://iconify.design), thanks to [**icns**][icns].
- [x] [Full control via parameters](#parameters) in either the first section of the URL's pathname, or query string.

---  

### Schema

<pre><code>https://migo.deno.dev/<strong>:title</strong>.(png|svg)</code></pre>
<pre><code>https://migo.deno.dev/<strong>:title</strong>/<strong>:subtitle</strong>.(png|svg)</code></pre>
<pre><code>https://migo.deno.dev/<strong>:params</strong>/<strong>:title</strong>.(png|svg)</code></pre>
<pre><code>https://migo.deno.dev/<strong>:params</strong>/<strong>:title</strong>/<strong>:subtitle</strong>.(png|svg)</code></pre>

### Icons

Icons are embedded from [**icns**](https://icns.ml), another Deno-powered project of mine. This means direct access to **over 100,000 icons**, and **millions of color combinations**.

### Formats

Every image is initially sculpted as an SVG ([Scalable Vector Graphics][svg]), and you can optionally add the extension **`.svg`** to force that format in the response. Unfortunately most social media platforms don't support social images in SVG format yet, so requests without an `.{svg,png}` extension are redirected to `.png` prior to rendering.

### Performance

The only lag you might encounter is the very first time an image is requested (this is unavoidable due to the render/raster steps). Thankfully, your users should essentially never be the ones encountering that lag time; they get a cache hit from their nearest edge datacenter.

### Parameters

There are numerous parameters you can use to control the look and feel of the generated images. Parameters can be provided in either the first part of the path or in the query string of the URL.

#### Path (recommended)

Allowed delimiters for the path-style schema are `&` (ampersand), `;` (semi-colon), or `::` (double-colon). 

<pre><code>https://migo.deno.dev/<strong>bgColor=white;titleColor=black;icon=typescript</strong>/Title.png</code></pre>

#### Query String

When using the query string schema, you **must** use the standard `&` (ampersand) delimiter.

<pre><code>https://migo.deno.dev/Title.png?<strong>bgColor=white&titleColor=black&icon=typescript</strong></code></pre>

Below is a list of all available parameters and their default value / formula used to calculate the value.

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

## Examples

![Edge-rendered OpenGraph Images on Deno](https://migo.deno.dev/icon=deno&iconStrokeWidth=0.33&subtitleFontSize=48&iconColor=345&bgColor=234&iconStroke=fff&titleColor=fff&subtitleColor=papayawhip&titleY=425&subtitleFontSize=48/Edge-rendered%20OpenGraph%20Images%20with%20Deno/migo.deno.dev.png)

---  
<div align="center">

MIT © [Nicholas Berlette](https://github.com/nberlette)</div>

[kv]: https://developers.cloudflare.com/workers/runtime-apis/kv
[svg]: https://w3.org/TR/SVG
[resvg]: https://deno.land/x/resvg_wasm
[deno]: https://deno.com/deploy
[deploy]: https://dash.deno.com/new?url=https%3a%2f%2fgithub.com%2fnberlette%2fmigo
[icns]: https://icns.ml
