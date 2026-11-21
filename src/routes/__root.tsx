import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import * as React from 'react'
import appCss from '@/styles/app.css?url'
import { seo } from '@/utils/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...seo({
        title: 'VIBRA | Watch. Create. Earn.',
        description:
          'VIBRA is the next-gen short video platform. Watch viral videos, create content with AI tools, grow your audience and earn money. Join VIBRA Worldwide.',
      }),
    ],
    links: [
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [
      {
        src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXX',
        async: true,
        crossOrigin: 'anonymous',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
