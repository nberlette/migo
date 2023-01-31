/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "../deps.ts";
import { site } from "./constants.ts";
import {
  ColorSchemeButton,
  DeployButton,
  ExampleImage,
  Footer,
  GitHubButton,
  Heading,
  Link,
  ParamList,
  RouteSchema,
} from "./components.tsx";

export function Home() {
  return (
    <>
      <div class="max-w-2xl px-8 mx-auto h-screen relative">
        <div class="w-full py-10">
          {/* Header */}
          <header class="app-header relative">
            <h1 class="app-title">
              <Link href="/" title={site.title}>migo</Link>
            </h1>
            <ColorSchemeButton class="absolute top-7 right-2" />
          </header>
          <ExampleImage
            width={960}
            height={400}
            src={site.banner}
            url={site.repository}
          />

          {/* What is this? */}
          <Heading title="What is this?">What is this?</Heading>
          <p class="my-2 md:my-2.5 text-sm sm:text-base md:text-lg text-left leading-6">
            This is a free microservice for generating dynamic OG images (also
            called Twitter Cards or OpenGraph images) on the Edge, with{" "}
            <Link href="https://deno.com/deploy">Deno Deploy</Link>. All images
            are first rendered as SVG vectors, then rasterized to PNG, and
            ultimately cached as immutable assets. Totally customizable, with
            built-in support for multiple font faces, thousands of icons, and
            millions of colors, the possibilities are virtually endless.
          </p>
          <p class="mb-2 mt-4 md:mt-5 md:mb-2.5 text-sm md:text-base text-left leading-6">
            Read more and check out the source code at the{"   "}
            <Link href="https://github.com/nberlette/migo#readme">
              GitHub Repository
            </Link>. Found a bug? Please{" "}
            <Link href="https://github.com/nberlette/migo/issues/new">
              create an issue
            </Link>{" "}
            so it can be fixed. And if you find this project to be useful,
            please{" "}
            <Link href="https://github.com/nberlette/migo#readme">
              give it a star on GitHub
            </Link>. Thanks!
          </p>
          <p class="mb-2 mt-4 md:mt-5 md:mb-2.5 text-sm md:text-base text-left leading-6">
            &mdash;{" "}
            <Link href="https://github.com/nberlette">Nicholas Berlette</Link>
          </p>

          {/* Deploy With Deno button */}
          <div class="btn-wrapper">
            <DeployButton>Deploy with Deno</DeployButton>
            <GitHubButton>Star on GitHub</GitHubButton>
          </div>

          {/* Schema */}
          <Heading title="Schema">Schema</Heading>
          <RouteSchema />
          <RouteSchema subtitle=":subtitle" />
          <RouteSchema subtitle=":subtitle" params=":params" />

          {/* Parameters */}
          <Heading title="Parameters">Parameters and Defaults</Heading>
          <ParamList />

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
}
