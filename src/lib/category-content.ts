export type CategoryEditorial = {
  metaDescription: string;
  intro: string;
  body: [string, string];
  related: Array<{ slug: string; label: string }>;
};

export const CATEGORY_EDITORIAL: Record<string, CategoryEditorial> = {
  minimal: {
    metaDescription:
      "Browse clean minimalist wallpapers for iPhone, Android, iPad and tablets, with calm layouts, simple shapes and uncluttered lock-screen compositions.",
    intro:
      "Clean, restrained wallpapers designed to leave room for the clock, widgets and icons without making your screen feel busy.",
    body: [
      "Minimal wallpapers work best when the image supports the interface instead of competing with it. This collection focuses on simple forms, quiet color, generous negative space and balanced compositions that stay readable on a lock screen or home screen.",
      "Browse portrait options for phones and wider layouts for tablets, with HD and 4K files where available. If you prefer deeper blacks, explore AMOLED; for softer color and texture, try Aesthetic.",
    ],
    related: [
      { slug: "amoled", label: "AMOLED" },
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "abstract", label: "Abstract" },
    ],
  },
  aesthetic: {
    metaDescription:
      "Explore aesthetic wallpapers for iPhone, Android, iPad and tablets, including soft color, editorial textures, collage styles and calm lock-screen designs.",
    intro:
      "Curated aesthetic wallpapers with soft color, texture and editorial detail for lock screens and home screens that feel intentional rather than crowded.",
    body: [
      "Aesthetic wallpapers bring together mood, color and texture without locking the collection to one visual style. You will find soft palettes, collage-inspired layouts, dreamy scenes and polished editorial compositions that work well behind a clock or a light set of icons.",
      "Use this collection when you want your screen to feel styled but still usable. For a cleaner direction browse Minimal, or move toward deeper contrast with Dark and AMOLED wallpapers.",
    ],
    related: [
      { slug: "minimal", label: "Minimal" },
      { slug: "dark", label: "Dark" },
      { slug: "vintage", label: "Vintage" },
    ],
  },
  nature: {
    metaDescription:
      "Download nature wallpapers for phone and tablet, from mountains and water to skies, plants and peaceful landscapes for iPhone, Android and iPad.",
    intro:
      "Nature wallpapers built around calm landscapes, water, skies and organic detail, with compositions that stay useful behind your lock-screen interface.",
    body: [
      "Nature wallpapers are an easy way to add depth to a screen without relying on heavy graphics or text. This collection mixes atmospheric landscapes, water, plants and outdoor scenes with enough visual breathing room for the clock and notifications.",
      "Choose portrait images for phone lock screens or wider scenes for tablets. For more stylized scenery, browse Aesthetic; for night-focused imagery, explore Dark and Space.",
    ],
    related: [
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "space", label: "Space" },
      { slug: "dark", label: "Dark" },
    ],
  },
  cars: {
    metaDescription:
      "Browse car wallpapers for iPhone, Android, iPad and tablets, including performance cars, motorsport, night drives and clean automotive photography.",
    intro:
      "Automotive wallpapers featuring performance cars, motorsport and night-drive visuals, selected for strong composition on phones and tablets.",
    body: [
      "The Cars collection combines automotive photography and stylized performance imagery with screen-friendly framing. Expect close details, road scenes, motion, motorsport and darker compositions that work especially well on modern OLED displays.",
      "Phone wallpapers favor vertical framing while tablet images use wider compositions where available. For darker automotive looks, pair this category with AMOLED or Dark.",
    ],
    related: [
      { slug: "dark", label: "Dark" },
      { slug: "amoled", label: "AMOLED" },
      { slug: "city", label: "City" },
    ],
  },
  anime: {
    metaDescription:
      "Explore anime wallpapers for iPhone, Android, iPad and tablets, including character art, dramatic scenes, manga-inspired visuals and stylized backgrounds.",
    intro:
      "Anime wallpapers ranging from character-focused artwork to dramatic scenes and stylized backgrounds, formatted for phone and tablet screens.",
    body: [
      "This collection includes character art, manga-inspired visuals and cinematic anime scenes rather than limiting the category to one palette or treatment. The strongest wallpapers keep the focal point clear while leaving enough room for lock-screen controls and icons.",
      "Browse portrait designs for phones and wider compositions for tablets where available. If you prefer darker character art, the Dark and AMOLED categories are useful companions.",
    ],
    related: [
      { slug: "dark", label: "Dark" },
      { slug: "amoled", label: "AMOLED" },
      { slug: "aesthetic", label: "Aesthetic" },
    ],
  },
  space: {
    metaDescription:
      "Discover space wallpapers for iPhone, Android, iPad and tablets, featuring moons, stars, planets, deep skies and atmospheric cosmic scenes.",
    intro:
      "Moons, stars, planets and atmospheric cosmic scenes with enough contrast and negative space to work cleanly on a lock screen.",
    body: [
      "Space wallpapers naturally suit modern screens because dark skies create contrast around the clock and system UI. This collection includes lunar scenes, distant horizons, stars and abstract cosmic imagery in both quiet and dramatic compositions.",
      "For true-black designs with even less visual noise, browse AMOLED. For more landscape-driven scenes, Nature is a good next stop.",
    ],
    related: [
      { slug: "amoled", label: "AMOLED" },
      { slug: "dark", label: "Dark" },
      { slug: "nature", label: "Nature" },
    ],
  },
  dark: {
    metaDescription:
      "Browse dark wallpapers for iPhone, Android, iPad and tablets, with low-light photography, deep tones, moody artwork and screen-friendly contrast.",
    intro:
      "Low-light wallpapers with deep tones, restrained highlights and strong contrast for a calmer lock screen and home screen.",
    body: [
      "Dark wallpapers reduce visual clutter by keeping large parts of the screen subdued while preserving a clear focal point. The collection covers moody photography, graphic art, night scenes and high-contrast compositions that pair naturally with dark-mode interfaces.",
      "If your device uses an OLED display and you prefer true-black backgrounds, continue to AMOLED. For softer dark styling, Aesthetic offers more texture and color.",
    ],
    related: [
      { slug: "amoled", label: "AMOLED" },
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "space", label: "Space" },
    ],
  },
  abstract: {
    metaDescription:
      "Explore abstract wallpapers for iPhone, Android, iPad and tablets, including geometric forms, fluid shapes, layered color and modern graphic compositions.",
    intro:
      "Abstract wallpapers built from shape, rhythm, color and texture, giving your screen visual interest without relying on a literal subject.",
    body: [
      "Abstract designs are useful when you want a distinctive screen without a dominant subject competing with icons or widgets. This collection includes geometric forms, fluid surfaces, layered color and modern graphic compositions across both subtle and bold styles.",
      "For a quieter look, browse Minimal. If you prefer near-black abstract work, Dark and AMOLED are the strongest related collections.",
    ],
    related: [
      { slug: "minimal", label: "Minimal" },
      { slug: "amoled", label: "AMOLED" },
      { slug: "aesthetic", label: "Aesthetic" },
    ],
  },
  motivational: {
    metaDescription:
      "Download motivational and quote wallpapers for iPhone, Android, iPad and tablets, with readable lock-screen typography, discipline and positive reminders.",
    intro:
      "Motivational and quote wallpapers with readable typography, short reminders and enough space for the clock to stay clear on your lock screen.",
    body: [
      "A strong motivational wallpaper should be easy to read in a glance. This collection focuses on short quotes, mindset reminders, discipline themes and encouraging messages arranged to remain legible around the clock, notifications and lock-screen controls.",
      "Use these wallpapers as a daily visual cue without turning your screen into a poster. For faith-based encouragement, explore Bible Verses or Islamic wallpapers; for cleaner typography-first layouts, browse Minimal.",
    ],
    related: [
      { slug: "bible-verse", label: "Bible Verses" },
      { slug: "islamic", label: "Islamic" },
      { slug: "minimal", label: "Minimal" },
    ],
  },
  "bible-verse": {
    metaDescription:
      "Browse Bible verse and Christian wallpapers for iPhone, Android, iPad and tablets, with scripture-focused lock screens and peaceful faith designs.",
    intro:
      "Bible verse and Christian wallpapers designed around readable scripture, calm composition and enough space for a practical lock screen.",
    body: [
      "Bible verse wallpapers work best when the scripture remains the focal point without being crowded by the interface. This collection combines faith-centered text, Christian imagery and quieter backgrounds selected for phone and tablet screens.",
      "You will find both simple verse-first layouts and more expressive artwork. For non-religious encouragement, browse Motivational; for deep black faith designs, explore AMOLED and Dark.",
    ],
    related: [
      { slug: "motivational", label: "Motivational / Quotes" },
      { slug: "amoled", label: "AMOLED" },
      { slug: "minimal", label: "Minimal" },
    ],
  },
  islamic: {
    metaDescription:
      "Explore Islamic wallpapers for iPhone, Android, iPad and tablets, including peaceful reminders, calligraphy and faith-focused lock-screen designs.",
    intro:
      "Islamic wallpapers with peaceful reminders, calligraphy and faith-focused visuals composed to stay clear and respectful on phone and tablet screens.",
    body: [
      "This collection brings together Islamic reminders, calligraphy and contemplative visual themes in layouts that work naturally as lock screens and home screens. The emphasis is on clear composition, respectful presentation and enough negative space for the device interface.",
      "For broader encouragement without a religious focus, browse Motivational. Minimal and Dark also pair well with quieter faith-centered designs.",
    ],
    related: [
      { slug: "motivational", label: "Motivational / Quotes" },
      { slug: "minimal", label: "Minimal" },
      { slug: "dark", label: "Dark" },
    ],
  },
  love: {
    metaDescription:
      "Browse love wallpapers for iPhone, Android, iPad and tablets, including romantic, warm, floral and relationship-inspired screen designs.",
    intro:
      "Romantic and relationship-inspired wallpapers using warm color, flowers, soft imagery and simple expressions that remain usable on a screen.",
    body: [
      "Love wallpapers can be expressive without becoming visually crowded. This collection includes romantic scenes, floral imagery, soft colors and simple statements that work as everyday lock screens or home screens.",
      "For a softer editorial look, browse Aesthetic. Vintage is a good companion if you prefer romantic imagery with aged texture and nostalgic color.",
    ],
    related: [
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "vintage", label: "Vintage" },
      { slug: "minimal", label: "Minimal" },
    ],
  },
  city: {
    metaDescription:
      "Explore city wallpapers for iPhone, Android, iPad and tablets, featuring streets, architecture, skylines, night lights and urban photography.",
    intro:
      "Urban wallpapers featuring streets, architecture, skylines and city light, selected for strong depth and readable screen composition.",
    body: [
      "City wallpapers bring structure, depth and atmosphere to a screen through architecture, streets, transport and night lighting. The collection ranges from clean daytime scenes to darker blue-hour and illuminated city compositions.",
      "For more nostalgic urban imagery, try Vintage. Dark and Cars are useful related categories if you prefer night scenes and stronger contrast.",
    ],
    related: [
      { slug: "vintage", label: "Vintage" },
      { slug: "dark", label: "Dark" },
      { slug: "cars", label: "Cars" },
    ],
  },
  animals: {
    metaDescription:
      "Download animal wallpapers for iPhone, Android, iPad and tablets, with wildlife, pets and illustrated animal subjects in screen-friendly compositions.",
    intro:
      "Animal wallpapers featuring wildlife, pets and illustrated subjects with clear focal points and enough breathing room for the screen interface.",
    body: [
      "The Animals collection focuses on strong subjects and uncluttered framing so the image still works once a clock, notifications or icons are layered on top. Styles range from photography to illustration and playful character-driven designs.",
      "For animals in natural environments, browse Nature. If you prefer more stylized or soft-color compositions, Aesthetic is a useful companion category.",
    ],
    related: [
      { slug: "nature", label: "Nature" },
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "minimal", label: "Minimal" },
    ],
  },
  vintage: {
    metaDescription:
      "Browse vintage wallpapers for iPhone, Android, iPad and tablets, featuring retro photography, aged texture, nostalgic color and classic graphic styles.",
    intro:
      "Vintage and retro wallpapers with aged texture, nostalgic color, classic photography and graphic details that give a screen more character.",
    body: [
      "Vintage wallpapers use texture, typography, film-like color and older visual references to create a more tactile screen. This collection includes retro photography, classic vehicles, poster-inspired layouts and nostalgic scenes without limiting the style to one era.",
      "For a cleaner contemporary treatment, browse Minimal. Aesthetic and City are strong related collections for editorial and urban variations.",
    ],
    related: [
      { slug: "aesthetic", label: "Aesthetic" },
      { slug: "city", label: "City" },
      { slug: "cars", label: "Cars" },
    ],
  },
  amoled: {
    metaDescription:
      "Explore AMOLED wallpapers for iPhone and Android OLED screens, with true-black backgrounds, restrained highlights and high-contrast lock-screen designs.",
    intro:
      "True-black and near-black wallpapers built for OLED and AMOLED screens, using restrained highlights so the interface stays crisp and uncluttered.",
    body: [
      "AMOLED wallpapers lean on true black, deep shadow and selective highlights to create strong contrast on OLED displays. They are especially effective with dark-mode interfaces because the wallpaper stays visually quiet around the clock, notifications and icons.",
      "This collection includes minimal graphics, character art and high-contrast scenes. For a broader range of low-light imagery, browse Dark; for cleaner geometry, try Minimal.",
    ],
    related: [
      { slug: "dark", label: "Dark" },
      { slug: "minimal", label: "Minimal" },
      { slug: "abstract", label: "Abstract" },
    ],
  },
};
