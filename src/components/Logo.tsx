import { cn } from '@/lib/utils'

/**
 * The client's wordmark: navy artwork on white.
 *
 * It is only legible on light surfaces (--background, --card), so it must NOT
 * be placed on --gradient-hero or any other dark panel.
 *
 * Intrinsic size is 1300x680 (a tight crop of the supplied file, which had
 * heavy whitespace padding). width/height are set so the browser reserves the
 * right box and the header does not shift while the image loads; the height
 * utility drives the rendered size and `w-auto` keeps the aspect ratio.
 */
function LogoImage({ className }: { className?: string }) {
  return (
    <img
      src="/brand/cgl-logo.jpeg"
      alt="Caspian Global Logistics"
      width={1300}
      height={680}
      /*
        The asset is a JPEG, so it carries an opaque white box. `multiply`
        lets the white drop into whatever light surface sits behind it (the
        tinted footer, the translucent header) instead of showing a white
        rectangle. This only works on light backgrounds -- another reason the
        logo must never go on --gradient-hero.
      */
      className={cn('w-auto max-w-none mix-blend-multiply', className)}
    />
  )
}

/** Full lockup: mark, company name, gold rule, tagline. For roomy surfaces. */
export function Logo({ className }: { className?: string }) {
  return <LogoImage className={className} />
}

/**
 * Header lockup.
 *
 * The supplied asset stacks four elements (mark / company name / rule /
 * tagline). At a 40px header height all four together are too small to read,
 * so the artwork is rendered at a larger scale and the box clips the rule and
 * tagline away, leaving the mark and "CASPIAN GLOBAL LOGISTICS" legible. The
 * image itself is never stretched -- only cropped by the container.
 */
export function HeaderLogo() {
  return (
    /*
      In the 1300x680 artwork the company-name line ends at about y=490, i.e.
      72% of the height. Rendering at 55px and clipping to a 40px box shows
      the top 72% -- the mark plus the name -- and drops the rule and tagline.
    */
    <span className="inline-flex h-10 items-start overflow-hidden">
      <LogoImage className="h-[55px]" />
    </span>
  )
}
