function AboutPage() {
  return (
    <section>
      <h1 className="flex flex-wrap gap-2 sm:gap-x-6 items-center justify-center text-4xl font-bold leading-none tracking-wide sm:text-6xl">
        Mat
        <span className="bg-primary py-2 px-4 rounded-lg tracking-widest text-white">
          Hub
        </span>
      </h1>
      <p className="mt-6 text-lg tracking-wide leading-8 max-w-2xl mx-auto text-muted-foreground">
        A web-based platform built with Next.js, TypeScript, and a
        Supabase/PostgreSQL backend that enables users to search, browse, and
        retrieve used building materials from a database of
        soon-to-be-demolished buildings. The platform allows filtering by
        geometry, location, material type, and other criteria to facilitate
        sustainable design using reclaimed components. It also functions as a
        collaborative knowledge-sharing database, promoting the reuse and
        circular lifecycle of construction materials.
      </p>
    </section>
  );
}
export default AboutPage;
