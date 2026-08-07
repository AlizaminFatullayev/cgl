/**
 * Stand-in for every route that has not been built yet. Renders nothing but
 * the route's name -- real screens arrive in later phases.
 */
export function PlaceholderPage({ name }: { name: string }) {
  return <h1 className="text-2xl font-semibold">{name}</h1>
}
