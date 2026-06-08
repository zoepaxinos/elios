"use client";

import { motion } from "framer-motion";

type CafeInfo = {
  name: string;
  tagline?: string;
  about?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: { days: string; time: string }[];
  instagram?: string;
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

type Props = {
  info: CafeInfo | null;
  menu: MenuCategory[];
  announcement: Announcement;
};

const smooth = [0.22, 1, 0.36, 1] as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smooth } },
};

const staggerList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const cardsStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: smooth },
  },
};

export default function AnimatedHome({ info, menu, announcement }: Props) {
  const cafeName = info?.name ?? "Elio's";

  return (
    <>
      {/* ── Announcement Banner ── */}
      {announcement?.text && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: smooth }}
          className="bg-terracotta text-white/90 text-center py-3 px-6 text-sm font-body tracking-wide"
        >
          {announcement.text}
        </motion.div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pb-32 space-y-28">
        {/* ── About ── */}
        {info?.about && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={sectionReveal}
          >
            <div className="divider mb-10">
              <span className="font-display italic text-sm text-terracotta px-4">
                our story
              </span>
            </div>
            <p className="text-espresso-light leading-[1.95] text-base text-center max-w-lg mx-auto font-light">
              {info.about}
            </p>
          </motion.section>
        )}

        {/* ── Menu ── */}
        {menu.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={sectionReveal}
          >
            <div className="divider mb-14">
              <span className="font-display italic text-sm text-terracotta px-4">
                menu
              </span>
            </div>

            <div className="space-y-16">
              {menu.map((category) => (
                <motion.div
                  key={category._id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <h3 className="font-display text-2xl sm:text-3xl text-espresso text-center tracking-wide">
                    {category.title}
                  </h3>
                  {category.description && (
                    <p className="text-espresso-light/70 text-sm text-center font-light italic mt-2 mb-8">
                      {category.description}
                    </p>
                  )}
                  {!category.description && <div className="mb-8" />}

                  <motion.ul variants={staggerList} className="space-y-4">
                    {category.items.map((item) => (
                      <motion.li
                        key={item._id}
                        variants={listItem}
                        whileHover={{
                          x: 4,
                          backgroundColor: "rgba(245, 237, 228, 0.6)",
                        }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg px-4 py-3 -mx-4 cursor-default"
                      >
                        <div className="flex items-baseline">
                          <span className="font-display text-lg text-espresso shrink-0">
                            {item.name}
                          </span>
                          {item.dietary && item.dietary.length > 0 && (
                            <span className="ml-2.5 text-[10px] text-olive uppercase tracking-widest shrink-0">
                              {item.dietary.join(" · ")}
                            </span>
                          )}
                          <span className="menu-dots" />
                          <span className="text-sm text-espresso-light font-body tabular-nums shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[13px] text-espresso-light/60 mt-1.5 font-light leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Visit ── */}
        {(info?.hours || info?.address || info?.phone) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={sectionReveal}
          >
            <div className="divider mb-14">
              <span className="font-display italic text-sm text-terracotta px-4">
                visit us
              </span>
            </div>

            <motion.div
              variants={cardsStagger}
              className="grid gap-6 sm:grid-cols-2"
            >
              {info?.hours && info.hours.length > 0 && (
                <motion.div
                  variants={cardReveal}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 8px 30px rgba(28, 18, 16, 0.08)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-cream/40 rounded-2xl p-8 border border-sand/50"
                >
                  <h3 className="font-display text-xl text-espresso mb-5">
                    Hours
                  </h3>
                  <ul className="space-y-2.5">
                    {info.hours.map((h, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-espresso">{h.days}</span>
                        <span className="text-espresso-light font-light">
                          {h.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
              {(info?.address || info?.phone || info?.email) && (
                <motion.div
                  variants={cardReveal}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 8px 30px rgba(28, 18, 16, 0.08)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-cream/40 rounded-2xl p-8 border border-sand/50"
                >
                  <h3 className="font-display text-xl text-espresso mb-5">
                    Find Us
                  </h3>
                  <div className="space-y-3 text-sm">
                    {info?.address && (
                      <p className="text-espresso-light leading-relaxed">
                        {info.address}
                      </p>
                    )}
                    {info?.phone && (
                      <p className="text-espresso-light">{info.phone}</p>
                    )}
                    {info?.email && (
                      <p className="text-terracotta">{info.email}</p>
                    )}
                  </div>
                  {info?.instagram && (
                    <a
                      href={info.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-6 text-[11px] uppercase tracking-[0.2em] text-terracotta hover:text-terracotta-dark transition-colors duration-300"
                    >
                      Instagram &rarr;
                    </a>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.section>
        )}
      </main>

    </>
  );
}
