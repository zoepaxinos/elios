import { client } from "@/sanity/client";
import { cafeInfoQuery, menuQuery, announcementQuery } from "@/sanity/queries";

type CafeInfo = {
  name: string;
  tagline?: string;
  about?: string;
  address?: string;
  phone?: string;
  hours?: { days: string; time: string }[];
};

type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  dietary?: string[];
};

type MenuCategory = {
  _id: string;
  title: string;
  description?: string;
  items: MenuItem[];
};

type Announcement = {
  text: string;
} | null;

export default async function Home() {
  const [info, menu, announcement] = await Promise.all([
    client.fetch<CafeInfo>(cafeInfoQuery),
    client.fetch<MenuCategory[]>(menuQuery),
    client.fetch<Announcement>(announcementQuery),
  ]);

  return (
    <>
      {/* Announcement banner */}
      {announcement?.text && (
        <div className="bg-stone-800 text-white text-center py-2 text-sm">
          {announcement.text}
        </div>
      )}

      {/* Hero */}
      <header className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          {info?.name ?? "Elio's"}
        </h1>
        {info?.tagline && (
          <p className="mt-4 text-lg text-stone-600">{info.tagline}</p>
        )}
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-24 space-y-16">
        {/* About */}
        {info?.about && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-stone-600 leading-relaxed">{info.about}</p>
          </section>
        )}

        {/* Menu */}
        {menu.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-8">Menu</h2>
            <div className="space-y-10">
              {menu.map((category) => (
                <div key={category._id}>
                  <h3 className="text-lg font-medium mb-1">
                    {category.title}
                  </h3>
                  {category.description && (
                    <p className="text-stone-500 text-sm mb-4">
                      {category.description}
                    </p>
                  )}
                  <ul className="space-y-4">
                    {category.items.map((item) => (
                      <li
                        key={item._id}
                        className="flex justify-between items-start gap-4"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.dietary && item.dietary.length > 0 && (
                            <span className="ml-2 text-xs text-stone-400">
                              {item.dietary.join(", ")}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-sm text-stone-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          ${item.price.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info */}
        {(info?.hours || info?.address || info?.phone) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Visit</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {info.hours && info.hours.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Hours</h3>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {info.hours.map((h, i) => (
                      <li key={i}>
                        <span className="font-medium">{h.days}</span> {h.time}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(info.address || info.phone) && (
                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  {info.address && (
                    <p className="text-sm text-stone-600">{info.address}</p>
                  )}
                  {info.phone && (
                    <p className="text-sm text-stone-600 mt-1">{info.phone}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-stone-500">
        {info?.name ?? "Elio's"} &copy; {new Date().getFullYear()}
      </footer>
    </>
  );
}
