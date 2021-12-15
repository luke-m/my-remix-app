import { Links, LiveReload, Outlet, useCatch } from "remix";

import type { LinksFunction } from 'remix';
import styleUrl from './styles/global.css';
import styleUrlMedium from './styles/global-medium.css';
import styleUrlLarge from './styles/global-large.css';

export const links: LinksFunction = () => {
  return [
    {
      href: styleUrl,
      rel: 'stylesheet'
    },
    {
      href: styleUrlMedium,
      media: 'print, (min-width: 640px)',
      rel: 'stylesheet'
    },
    {
      href: styleUrlLarge,
      rel: 'stylesheet',
      media: "screen and (min-width: 1024px)"
    },
  ]
}

const Document = ({
  children,
  title = `Some lame jokes`
}: {
  children: React.ReactNode;
  title?: string;
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <LiveReload />
        ) : null}
      </body>
    </html>
  )
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

export const ErrorBoundary = ({error}: {error: Error}) => {
  return (
    <Document title="Uh-oh!">
      <div className="error-container">
        <h1>App Error</h1>
        <pre>{error.stack}</pre>
      </div>
    </Document>
  )
}

export const CatchBoundary = () => {
  const caught = useCatch();

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <div className="error-container">
        <h1>{caught.status} {caught.statusText} [root]</h1>
        <pre>{caught.data}</pre>
      </div>
    </Document>
  )
}