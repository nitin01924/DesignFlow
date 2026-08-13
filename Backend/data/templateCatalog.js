const FABRIC_VERSION = "7.4.0";

export const TEMPLATE_CATEGORIES = Object.freeze([
  "Social Media",
  "Marketing",
  "Business",
  "Personal",
]);

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const toSvgDataUrl = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const imagePalettes = {
  sunset: ["#fb7185", "#f97316", "#fde68a"],
  ocean: ["#0f766e", "#06b6d4", "#a5f3fc"],
  violet: ["#4c1d95", "#8b5cf6", "#ddd6fe"],
  lime: ["#365314", "#84cc16", "#ecfccb"],
  studio: ["#111827", "#475569", "#e2e8f0"],
  rose: ["#881337", "#e11d48", "#fecdd3"],
};

const createPackagedImage = (theme, width = 800, height = 600) => {
  const [dark, accent, light] = imagePalettes[theme] || imagePalettes.studio;
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${dark}"/>
          <stop offset="0.58" stop-color="${accent}"/>
          <stop offset="1" stop-color="${light}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <circle cx="${width * 0.78}" cy="${height * 0.24}" r="${Math.min(width, height) * 0.22}" fill="#fff" fill-opacity=".2"/>
      <path d="M0 ${height * 0.82} Q ${width * 0.28} ${height * 0.55} ${width * 0.53} ${height * 0.78} T ${width} ${height * 0.58} V ${height} H0Z" fill="${dark}" fill-opacity=".48"/>
      <path d="M0 ${height * 0.9} Q ${width * 0.24} ${height * 0.72} ${width * 0.5} ${height * 0.88} T ${width} ${height * 0.7} V ${height} H0Z" fill="#fff" fill-opacity=".2"/>
    </svg>
  `);
};

const rect = (name, left, top, width, height, fill, options = {}) => ({
  kind: "rect",
  name,
  left,
  top,
  width,
  height,
  fill,
  rx: options.rx || 0,
  ry: options.ry ?? options.rx ?? 0,
  angle: options.angle || 0,
  opacity: options.opacity ?? 1,
  stroke: options.stroke || null,
  strokeWidth: options.strokeWidth || 0,
});

const circle = (name, left, top, radius, fill, options = {}) => ({
  kind: "circle",
  name,
  left,
  top,
  radius,
  fill,
  opacity: options.opacity ?? 1,
  stroke: options.stroke || null,
  strokeWidth: options.strokeWidth || 0,
});

const text = (name, value, left, top, width, fontSize, fill, options = {}) => ({
  kind: "text",
  name,
  value,
  left,
  top,
  width,
  fontSize,
  fill,
  fontFamily: options.fontFamily || "Arial",
  fontWeight: options.fontWeight || 400,
  textAlign: options.textAlign || "left",
  lineHeight: options.lineHeight || 1.08,
  charSpacing: options.charSpacing || 0,
  angle: options.angle || 0,
  opacity: options.opacity ?? 1,
});

const image = (name, left, top, width, height, theme, options = {}) => ({
  kind: "image",
  name,
  left,
  top,
  width,
  height,
  theme,
  angle: options.angle || 0,
  opacity: options.opacity ?? 1,
});

const frame = (name, left, top, width, height, frameKind, theme, options = {}) => ({
  kind: "frame",
  name,
  left,
  top,
  width,
  height,
  frameKind,
  theme,
  angle: options.angle || 0,
  opacity: options.opacity ?? 1,
});

const iconPaths = {
  star: "M12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3Z",
  heart: "M12 21S3 15.5 3 9.5C3 5.8 7.5 3.8 10.2 6.5L12 8.3l1.8-1.8C16.5 3.8 21 5.8 21 9.5 21 15.5 12 21 12 21Z",
  spark: "M12 1 14.7 8.3 22 11 14.7 13.7 12 21 9.3 13.7 2 11 9.3 8.3Z",
  arrow: "M3 11h13l-4-4 1.4-1.4L20 12l-6.6 6.4L12 17l4-4H3Z",
  calendar: "M5 3h2v2h10V3h2v2h2v16H3V5h2Zm14 7H5v9h14Z",
  briefcase: "M9 4h6l2 3h4v13H3V7h4Zm1.2 3h3.6l-1-1.5h-1.6Z",
};

const icon = (name, iconId, left, top, size, color, options = {}) => ({
  kind: "icon",
  name,
  iconId,
  left,
  top,
  size,
  color,
  angle: options.angle || 0,
  opacity: options.opacity ?? 1,
});

const templateDefinitions = [
  {
    id: "instagram-bold-launch",
    name: "Bold Product Launch — Instagram Post",
    category: "Social Media",
    description: "A vivid Instagram launch post with a product frame and clear call to action.",
    width: 1080,
    height: 1080,
    background: "#fff7ed",
    elements: [
      circle("Coral accent", 930, 120, 230, "#fb7185", { opacity: 0.26 }),
      rect("Headline panel", 282, 540, 500, 900, "#111827", { rx: 42 }),
      text("Eyebrow", "NEW COLLECTION", 282, 205, 390, 30, "#fdba74", { fontWeight: 700, charSpacing: 180, textAlign: "center" }),
      text("Heading", "MAKE IT\nYOURS", 282, 420, 410, 104, "#ffffff", { fontWeight: 800, textAlign: "center", lineHeight: 0.92 }),
      text("Description", "Designed for bright ideas and bold everyday moments.", 282, 645, 360, 30, "#cbd5e1", { textAlign: "center", lineHeight: 1.3 }),
      rect("Call to action", 282, 808, 250, 76, "#f97316", { rx: 38 }),
      text("Call to action text", "SHOP NOW", 282, 808, 210, 26, "#ffffff", { fontWeight: 700, textAlign: "center", charSpacing: 90 }),
      frame("Product photo", 795, 575, 430, 650, "roundedRectangle", "sunset", { angle: 4 }),
      icon("Sparkle", "spark", 914, 910, 92, "#f97316", { angle: 10 }),
    ],
  },
  {
    id: "instagram-story-travel",
    name: "Wander Instagram Story",
    category: "Social Media",
    description: "A cinematic Instagram Story for travel, lifestyle, or personal storytelling.",
    width: 1080,
    height: 1920,
    background: "#0f172a",
    elements: [
      image("Travel image", 540, 700, 920, 1120, "ocean", { opacity: 0.92 }),
      rect("Top label", 540, 130, 860, 100, "#ffffff", { rx: 50, opacity: 0.13 }),
      text("Location", "COASTAL NOTES  •  2026", 540, 130, 760, 30, "#ffffff", { textAlign: "center", fontWeight: 700, charSpacing: 120 }),
      text("Story heading", "GO WHERE\nYOU FEEL\nALIVE", 540, 1260, 850, 122, "#ffffff", { textAlign: "center", fontWeight: 800, lineHeight: 0.92 }),
      text("Story caption", "A quiet guide to meaningful weekends away.", 540, 1605, 700, 36, "#bae6fd", { textAlign: "center" }),
      rect("Swipe cue", 540, 1770, 350, 82, "#22d3ee", { rx: 41 }),
      text("Swipe text", "EXPLORE THE GUIDE", 540, 1770, 300, 25, "#083344", { textAlign: "center", fontWeight: 800, charSpacing: 80 }),
    ],
  },
  {
    id: "youtube-creator-focus",
    name: "Creator Focus YouTube Thumbnail",
    category: "Social Media",
    description: "A high-contrast YouTube thumbnail built for clear messaging at small sizes.",
    width: 1280,
    height: 720,
    background: "#facc15",
    elements: [
      rect("Dark diagonal", 1080, 360, 560, 820, "#111827", { angle: -9 }),
      circle("Accent circle", 1020, 180, 220, "#f97316", { opacity: 0.7 }),
      frame("Creator portrait", 1000, 390, 430, 560, "roundedRectangle", "violet"),
      text("Series label", "DESIGNFLOW LAB", 105, 100, 430, 27, "#713f12", { fontWeight: 800, charSpacing: 130 }),
      text("Thumbnail heading", "DESIGN\nFASTER", 105, 325, 660, 112, "#111827", { fontWeight: 900, lineHeight: 0.88 }),
      rect("Episode badge", 240, 610, 270, 64, "#111827", { rx: 14 }),
      text("Episode", "10 PRO TIPS", 240, 610, 230, 28, "#ffffff", { textAlign: "center", fontWeight: 800 }),
      icon("Arrow", "arrow", 665, 550, 105, "#111827", { angle: -12 }),
    ],
  },
  {
    id: "linkedin-insight-card",
    name: "LinkedIn Insight Post",
    category: "Social Media",
    description: "A refined thought-leadership post for professional insights and announcements.",
    width: 1200,
    height: 627,
    background: "#eff6ff",
    elements: [
      rect("Brand bar", 72, 314, 72, 627, "#2563eb"),
      circle("Profile frame backing", 1030, 138, 94, "#bfdbfe"),
      frame("Profile photo", 1030, 138, 160, 160, "circle", "studio"),
      text("Category", "LEADERSHIP • 5 MIN READ", 160, 95, 640, 25, "#2563eb", { fontWeight: 800, charSpacing: 90 }),
      text("Insight heading", "Great products start\nwith better questions.", 160, 275, 760, 64, "#0f172a", { fontWeight: 800, lineHeight: 1.02 }),
      text("Insight excerpt", "Three prompts our team uses to turn ambiguity into clear product decisions.", 160, 465, 760, 29, "#475569", { lineHeight: 1.28 }),
      text("Author", "NITIN KUMAR  /  PRODUCT BUILDER", 855, 545, 290, 18, "#334155", { textAlign: "center", fontWeight: 700, charSpacing: 55 }),
    ],
  },
  {
    id: "sale-poster-weekend",
    name: "Weekend Sale Poster",
    category: "Marketing",
    description: "A retail-ready sale poster with energetic hierarchy and a strong promotional badge.",
    width: 1080,
    height: 1350,
    background: "#ecfccb",
    elements: [
      rect("Top ribbon", 540, 105, 1080, 210, "#1a2e05"),
      text("Ribbon text", "LIMITED WEEKEND OFFER", 540, 105, 820, 31, "#bef264", { textAlign: "center", fontWeight: 800, charSpacing: 150 }),
      circle("Sale badge", 835, 505, 245, "#f97316"),
      text("Discount", "50%\nOFF", 835, 505, 380, 104, "#ffffff", { textAlign: "center", fontWeight: 900, lineHeight: 0.82, angle: -8 }),
      frame("Sale product", 390, 660, 560, 690, "blob", "lime", { angle: -3 }),
      text("Sale heading", "FRESH FINDS", 540, 1070, 900, 84, "#1a2e05", { textAlign: "center", fontWeight: 900 }),
      text("Sale dates", "FRIDAY — SUNDAY  •  ONLINE & IN STORE", 540, 1170, 830, 27, "#3f6212", { textAlign: "center", fontWeight: 700, charSpacing: 65 }),
      rect("Shop button", 540, 1265, 310, 74, "#1a2e05", { rx: 37 }),
      text("Shop button text", "SHOP THE SALE", 540, 1265, 260, 25, "#ffffff", { textAlign: "center", fontWeight: 800 }),
    ],
  },
  {
    id: "product-ad-skincare",
    name: "Clean Product Advertisement",
    category: "Marketing",
    description: "A polished product advertisement with an editorial image and benefit-led copy.",
    width: 1080,
    height: 1080,
    background: "#fdf2f8",
    elements: [
      circle("Soft halo", 780, 450, 360, "#fbcfe8"),
      frame("Product frame", 770, 505, 470, 650, "ellipse", "rose"),
      text("Brand", "LUMEN / SKIN", 110, 105, 430, 27, "#9f1239", { fontWeight: 800, charSpacing: 180 }),
      text("Product heading", "GLOW,\nSIMPLIFIED.", 110, 365, 510, 78, "#4c0519", { fontWeight: 800, lineHeight: 0.94 }),
      text("Product copy", "A daily ritual with barrier-loving botanicals and a weightless finish.", 110, 625, 430, 29, "#881337", { lineHeight: 1.35 }),
      rect("Benefit one", 230, 810, 240, 64, "#ffffff", { rx: 32 }),
      text("Benefit one text", "VEGAN", 230, 810, 190, 22, "#9f1239", { textAlign: "center", fontWeight: 800 }),
      rect("Benefit two", 230, 890, 240, 64, "#ffffff", { rx: 32 }),
      text("Benefit two text", "DERM TESTED", 230, 890, 190, 22, "#9f1239", { textAlign: "center", fontWeight: 800 }),
      icon("Brand sparkle", "spark", 945, 120, 82, "#e11d48"),
    ],
  },
  {
    id: "event-poster-future",
    name: "Future Makers Event",
    category: "Marketing",
    description: "A modern conference poster with bold type, event details, and energetic graphics.",
    width: 1080,
    height: 1350,
    background: "#0f172a",
    elements: [
      circle("Blue glow", 930, 220, 360, "#2563eb", { opacity: 0.52 }),
      circle("Violet glow", 160, 1170, 300, "#7c3aed", { opacity: 0.48 }),
      rect("Event date card", 820, 1080, 360, 350, "#ffffff", { rx: 30 }),
      text("Event label", "DESIGN + TECHNOLOGY SUMMIT", 100, 110, 760, 28, "#a5b4fc", { fontWeight: 800, charSpacing: 105 }),
      text("Event heading", "FUTURE\nMAKERS", 100, 485, 800, 128, "#ffffff", { fontWeight: 900, lineHeight: 0.86 }),
      text("Event subtitle", "Ideas, systems, and people shaping what comes next.", 105, 790, 650, 34, "#cbd5e1", { lineHeight: 1.3 }),
      text("Event day", "18", 820, 1010, 250, 118, "#0f172a", { textAlign: "center", fontWeight: 900 }),
      text("Event month", "OCTOBER / 10 AM", 820, 1140, 290, 25, "#4f46e5", { textAlign: "center", fontWeight: 800, charSpacing: 55 }),
      text("Event place", "CITY HALL\nNEW DELHI", 820, 1240, 270, 23, "#475569", { textAlign: "center", fontWeight: 700, lineHeight: 1.2 }),
      icon("Event star", "star", 865, 465, 120, "#facc15", { angle: 12 }),
    ],
  },
  {
    id: "business-flyer-studio",
    name: "Creative Studio Flyer",
    category: "Marketing",
    description: "A structured service flyer for agencies, studios, and independent professionals.",
    width: 1240,
    height: 1754,
    background: "#f8fafc",
    elements: [
      rect("Navy masthead", 620, 300, 1240, 600, "#172554"),
      image("Studio image", 890, 745, 520, 650, "violet", { angle: 2 }),
      text("Studio name", "NORTH / CREATIVE", 100, 105, 700, 30, "#93c5fd", { fontWeight: 800, charSpacing: 160 }),
      text("Flyer heading", "BRANDS WITH\nA POINT OF VIEW.", 100, 355, 900, 88, "#ffffff", { fontWeight: 800, lineHeight: 0.96 }),
      text("Intro", "Strategy, identity, and digital experiences for ambitious teams.", 100, 735, 600, 40, "#1e3a8a", { fontWeight: 700, lineHeight: 1.3 }),
      rect("Service card one", 330, 1070, 460, 260, "#dbeafe", { rx: 26 }),
      text("Service one", "01\nBRAND STRATEGY", 330, 1070, 350, 38, "#172554", { fontWeight: 800, lineHeight: 1.25 }),
      rect("Service card two", 910, 1070, 460, 260, "#ede9fe", { rx: 26 }),
      text("Service two", "02\nDIGITAL DESIGN", 910, 1070, 350, 38, "#4c1d95", { fontWeight: 800, lineHeight: 1.25 }),
      text("Contact", "HELLO@NORTH.STUDIO  •  NORTH.STUDIO", 620, 1590, 950, 27, "#334155", { textAlign: "center", fontWeight: 800, charSpacing: 80 }),
    ],
  },
  {
    id: "business-card-minimal",
    name: "Minimal Business Card",
    category: "Business",
    description: "A crisp professional business card with a memorable geometric identity.",
    width: 1050,
    height: 600,
    background: "#ffffff",
    elements: [
      rect("Identity block", 185, 300, 370, 600, "#0f172a"),
      circle("Logo circle", 185, 195, 76, "#38bdf8"),
      icon("Logo spark", "spark", 185, 195, 78, "#0f172a"),
      text("Name", "NITIN KUMAR", 470, 190, 470, 55, "#0f172a", { fontWeight: 800 }),
      text("Role", "FULL-STACK DEVELOPER", 470, 260, 470, 23, "#0284c7", { fontWeight: 800, charSpacing: 100 }),
      rect("Divider", 710, 335, 480, 3, "#cbd5e1"),
      text("Contact details", "+91 98175 06079\nnitin981275@gmail.com\nnitinkumar.dev", 470, 435, 480, 24, "#475569", { lineHeight: 1.55 }),
      text("Initials", "NK", 185, 365, 220, 92, "#ffffff", { textAlign: "center", fontWeight: 900 }),
    ],
  },
  {
    id: "presentation-cover-quarterly",
    name: "Quarterly Strategy Presentation Cover",
    category: "Business",
    description: "An executive presentation cover for reviews, strategy, and planning decks.",
    width: 1600,
    height: 900,
    background: "#f1f5f9",
    elements: [
      rect("Navy panel", 1180, 450, 840, 900, "#0f172a"),
      circle("Blue orbit", 1290, 340, 300, "transparent", { stroke: "#3b82f6", strokeWidth: 32, opacity: 0.82 }),
      circle("Violet orbit", 1400, 570, 230, "transparent", { stroke: "#8b5cf6", strokeWidth: 22, opacity: 0.8 }),
      text("Quarter label", "Q3 / 2026", 130, 115, 500, 28, "#2563eb", { fontWeight: 800, charSpacing: 155 }),
      text("Presentation heading", "GROWTH\nWITH FOCUS", 130, 390, 830, 98, "#0f172a", { fontWeight: 900, lineHeight: 0.92 }),
      text("Presentation subtitle", "Quarterly strategy, priorities, and operating plan", 130, 665, 760, 34, "#475569", { lineHeight: 1.3 }),
      text("Presentation footer", "DESIGNFLOW  /  STRATEGY TEAM", 130, 820, 650, 22, "#64748b", { fontWeight: 800, charSpacing: 85 }),
      icon("Cover arrow", "arrow", 1290, 450, 150, "#ffffff", { angle: -35 }),
    ],
  },
  {
    id: "resume-product-designer",
    name: "Modern Professional Resume",
    category: "Personal",
    description: "A clean one-page resume with editable experience, skills, and profile details.",
    width: 1240,
    height: 1754,
    background: "#ffffff",
    elements: [
      rect("Sidebar", 235, 877, 470, 1754, "#0f172a"),
      frame("Profile photo", 235, 225, 220, 220, "circle", "studio"),
      text("Resume name", "NITIN\nKUMAR", 235, 455, 350, 68, "#ffffff", { textAlign: "center", fontWeight: 900, lineHeight: 0.92 }),
      text("Resume role", "MERN STACK DEVELOPER", 235, 610, 360, 23, "#7dd3fc", { textAlign: "center", fontWeight: 800, charSpacing: 80 }),
      text("Contact heading", "CONTACT", 80, 795, 300, 24, "#7dd3fc", { fontWeight: 800, charSpacing: 110 }),
      text("Contact information", "nitin981275@gmail.com\n+91 98175 06079\nHimachal Pradesh, India", 80, 925, 310, 23, "#e2e8f0", { lineHeight: 1.65 }),
      text("Skills heading", "SKILLS", 80, 1180, 300, 24, "#7dd3fc", { fontWeight: 800, charSpacing: 110 }),
      text("Skills", "React / Node.js\nMongoDB / Express\nUI systems / Fabric.js", 80, 1320, 310, 23, "#e2e8f0", { lineHeight: 1.65 }),
      text("Profile heading", "PROFILE", 560, 205, 500, 29, "#0284c7", { fontWeight: 900, charSpacing: 105 }),
      text("Profile copy", "Full-stack developer focused on thoughtful interfaces, scalable APIs, and reliable product experiences.", 560, 335, 560, 29, "#334155", { lineHeight: 1.45 }),
      text("Experience heading", "EXPERIENCE", 560, 560, 560, 29, "#0284c7", { fontWeight: 900, charSpacing: 105 }),
      text("Experience", "DESIGNFLOW  /  LEAD DEVELOPER\n2025 — PRESENT\nBuilt a modular browser-based design editor with professional canvas workflows.\n\nNOTES APP  /  FULL-STACK PROJECT\n2024 — 2025\nDesigned, developed, and deployed a secure MERN application.", 560, 930, 570, 28, "#334155", { lineHeight: 1.42 }),
      text("Education heading", "EDUCATION", 560, 1390, 560, 29, "#0284c7", { fontWeight: 900, charSpacing: 105 }),
      text("Education", "BACHELOR OF COMPUTER APPLICATIONS\nDegree completed", 560, 1515, 570, 27, "#334155", { lineHeight: 1.45 }),
    ],
  },
  {
    id: "announcement-new-home",
    name: "Simple Announcement",
    category: "Personal",
    description: "A warm, versatile announcement for milestones, news, or personal updates.",
    width: 1080,
    height: 1080,
    background: "#fffbeb",
    elements: [
      circle("Warm sun", 540, 430, 300, "#fde68a"),
      frame("Announcement photo", 540, 430, 500, 500, "circle", "sunset"),
      icon("Small heart", "heart", 845, 175, 72, "#e11d48", { angle: 10 }),
      text("Announcement label", "A LITTLE UPDATE FROM US", 540, 105, 760, 27, "#92400e", { textAlign: "center", fontWeight: 800, charSpacing: 130 }),
      text("Announcement heading", "We moved!", 540, 790, 760, 82, "#451a03", { textAlign: "center", fontWeight: 800 }),
      text("Announcement copy", "New home, same open door. Come visit us soon.", 540, 900, 700, 31, "#78350f", { textAlign: "center" }),
      text("Announcement footer", "WITH LOVE  •  THE KUMARS", 540, 1005, 700, 23, "#b45309", { textAlign: "center", fontWeight: 800, charSpacing: 105 }),
    ],
  },
  {
    id: "personal-celebration-invite",
    name: "Celebration Invitation",
    category: "Personal",
    description: "An elegant invitation for birthdays, dinners, and intimate celebrations.",
    width: 1080,
    height: 1350,
    background: "#faf5ff",
    elements: [
      rect("Invitation border", 540, 675, 940, 1210, "transparent", { rx: 36, stroke: "#a855f7", strokeWidth: 4 }),
      circle("Top bloom", 900, 170, 210, "#e9d5ff", { opacity: 0.82 }),
      circle("Bottom bloom", 150, 1180, 240, "#fbcfe8", { opacity: 0.8 }),
      icon("Invitation star", "star", 540, 210, 92, "#9333ea"),
      text("Invitation intro", "PLEASE JOIN US FOR", 540, 345, 750, 27, "#7e22ce", { textAlign: "center", fontWeight: 800, charSpacing: 145 }),
      text("Invitation heading", "An Evening\nto Celebrate", 540, 590, 800, 86, "#3b0764", { textAlign: "center", fontWeight: 700, lineHeight: 1.02 }),
      text("Invitation date", "SATURDAY  •  24 OCTOBER  •  7 PM", 540, 825, 820, 28, "#86198f", { textAlign: "center", fontWeight: 800, charSpacing: 70 }),
      text("Invitation place", "THE GARDEN ROOM\n42 LAKE VIEW ROAD", 540, 965, 700, 30, "#581c87", { textAlign: "center", lineHeight: 1.35 }),
      rect("RSVP pill", 540, 1160, 300, 72, "#7e22ce", { rx: 36 }),
      text("RSVP text", "RSVP BY OCT 10", 540, 1160, 250, 23, "#ffffff", { textAlign: "center", fontWeight: 800, charSpacing: 55 }),
    ],
  },
];

const commonFabricProperties = (element) => ({
  version: FABRIC_VERSION,
  originX: "center",
  originY: "center",
  left: element.left,
  top: element.top,
  angle: element.angle || 0,
  opacity: element.opacity ?? 1,
  visible: true,
  selectable: true,
  evented: true,
  name: element.name,
});

const toFabricObject = (element, templateId, index) => {
  const common = commonFabricProperties(element);
  if (element.kind === "text") {
    return {
      ...common,
      type: "Textbox",
      text: element.value,
      width: element.width,
      fontFamily: element.fontFamily,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      fill: element.fill,
      lineHeight: element.lineHeight,
      textAlign: element.textAlign,
      charSpacing: element.charSpacing,
      editable: true,
      padding: 4,
    };
  }
  if (element.kind === "circle") {
    return {
      ...common,
      type: "Circle",
      radius: element.radius,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      strokeUniform: true,
      assetType: "shape",
      assetId: "circle",
      assetLibrary: "designflow",
      shapeKind: "circle",
      aspectRatioLocked: true,
      lockedAspectRatio: 1,
    };
  }
  if (element.kind === "rect") {
    return {
      ...common,
      type: "Rect",
      width: element.width,
      height: element.height,
      rx: element.rx,
      ry: element.ry,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      strokeUniform: true,
      assetType: "shape",
      assetId: element.rx ? "rounded-rectangle" : "rectangle",
      assetLibrary: "designflow",
      shapeKind: element.rx ? "roundedRectangle" : "rectangle",
    };
  }
  if (element.kind === "icon") {
    return {
      ...common,
      type: "Path",
      path: iconPaths[element.iconId],
      fill: element.color,
      stroke: null,
      strokeWidth: 0,
      scaleX: element.size / 24,
      scaleY: element.size / 24,
      assetType: "icon",
      assetId: element.iconId,
      assetLibrary: "lucide",
      assetColor: element.color,
      aspectRatioLocked: true,
      lockedAspectRatio: 1,
    };
  }
  if (element.kind === "frame") {
    const source = createPackagedImage(element.theme);
    return {
      ...common,
      type: "DesignFlowFrame",
      width: element.width,
      height: element.height,
      fill: "transparent",
      strokeWidth: 0,
      frameKind: element.frameKind,
      frameAssetId:
        element.frameKind === "roundedRectangle"
          ? "rounded-rectangle"
          : element.frameKind,
      frameImageSrc: source,
      frameImageZoom: 1,
      frameImageOffsetX: 0,
      frameImageOffsetY: 0,
      assetType: "frame",
      assetId: `template-${templateId}-frame-${index + 1}`,
      assetLibrary: "designflow-template",
      aspectRatioLocked: element.frameKind === "circle",
      lockedAspectRatio: element.frameKind === "circle" ? 1 : undefined,
    };
  }
  const sourceWidth = 800;
  const sourceHeight = 600;
  return {
    ...common,
    type: "Image",
    width: sourceWidth,
    height: sourceHeight,
    scaleX: element.width / sourceWidth,
    scaleY: element.height / sourceHeight,
    src: createPackagedImage(element.theme, sourceWidth, sourceHeight),
    crossOrigin: "anonymous",
    assetType: "image",
    assetId: `template-${templateId}-image-${index + 1}`,
    assetLibrary: "designflow-template",
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    aspectRatioLocked: false,
  };
};

const renderTextPreview = (element) => {
  const lines = element.value.split("\n");
  const lineHeight = element.fontSize * element.lineHeight;
  const startY = element.top - ((lines.length - 1) * lineHeight) / 2;
  const x =
    element.textAlign === "center"
      ? element.left
      : element.textAlign === "right"
        ? element.left + element.width / 2
        : element.left - element.width / 2;
  const anchor =
    element.textAlign === "center"
      ? "middle"
      : element.textAlign === "right"
        ? "end"
        : "start";
  return `<text x="${x}" y="${startY}" fill="${escapeXml(element.fill)}" font-family="${escapeXml(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" text-anchor="${anchor}" letter-spacing="${element.charSpacing / 1000}em" opacity="${element.opacity}" transform="rotate(${element.angle} ${element.left} ${element.top})">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeXml(line)}</tspan>`,
    )
    .join("")}</text>`;
};

const renderFramePreview = (element, index) => {
  const x = element.left - element.width / 2;
  const y = element.top - element.height / 2;
  const clipId = `frame-${index}`;
  const clipShape =
    element.frameKind === "circle"
      ? `<circle cx="${element.left}" cy="${element.top}" r="${Math.min(element.width, element.height) / 2}"/>`
      : element.frameKind === "ellipse"
        ? `<ellipse cx="${element.left}" cy="${element.top}" rx="${element.width / 2}" ry="${element.height / 2}"/>`
        : `<rect x="${x}" y="${y}" width="${element.width}" height="${element.height}" rx="${element.frameKind === "roundedRectangle" ? 28 : 0}"/>`;
  return `<defs><clipPath id="${clipId}">${clipShape}</clipPath></defs><image href="${createPackagedImage(element.theme)}" x="${x}" y="${y}" width="${element.width}" height="${element.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" opacity="${element.opacity}" transform="rotate(${element.angle} ${element.left} ${element.top})"/><g fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="4">${clipShape}</g>`;
};

const renderPreviewElement = (element, index) => {
  if (element.kind === "text") return renderTextPreview(element);
  if (element.kind === "circle") {
    return `<circle cx="${element.left}" cy="${element.top}" r="${element.radius}" fill="${escapeXml(element.fill)}" stroke="${escapeXml(element.stroke || "none")}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
  }
  if (element.kind === "rect") {
    return `<rect x="${element.left - element.width / 2}" y="${element.top - element.height / 2}" width="${element.width}" height="${element.height}" rx="${element.rx}" fill="${escapeXml(element.fill)}" stroke="${escapeXml(element.stroke || "none")}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}" transform="rotate(${element.angle} ${element.left} ${element.top})"/>`;
  }
  if (element.kind === "icon") {
    return `<path d="${iconPaths[element.iconId]}" fill="${escapeXml(element.color)}" opacity="${element.opacity}" transform="translate(${element.left - element.size / 2} ${element.top - element.size / 2}) scale(${element.size / 24}) rotate(${element.angle} 12 12)"/>`;
  }
  if (element.kind === "frame") return renderFramePreview(element, index);
  return `<image href="${createPackagedImage(element.theme)}" x="${element.left - element.width / 2}" y="${element.top - element.height / 2}" width="${element.width}" height="${element.height}" preserveAspectRatio="xMidYMid slice" opacity="${element.opacity}" transform="rotate(${element.angle} ${element.left} ${element.top})"/>`;
};

const createTemplate = (definition) => {
  const canvasData = {
    version: FABRIC_VERSION,
    objects: definition.elements.map((element, index) =>
      toFabricObject(element, definition.id, index),
    ),
    background: definition.background,
    metadata: {
      sourceTemplateId: definition.id,
      templateVersion: 1,
    },
  };
  const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${definition.width}" height="${definition.height}" viewBox="0 0 ${definition.width} ${definition.height}"><rect width="100%" height="100%" fill="${escapeXml(definition.background)}"/>${definition.elements
    .map(renderPreviewElement)
    .join("")}</svg>`;

  return Object.freeze({
    id: definition.id,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    canvasWidth: definition.width,
    canvasHeight: definition.height,
    preview: toSvgDataUrl(previewSvg),
    canvasData: Object.freeze(canvasData),
  });
};

const templates = Object.freeze(templateDefinitions.map(createTemplate));
const templatesById = new Map(templates.map((template) => [template.id, template]));

export const getTemplateCatalog = () => templates;

export const getTemplateById = (templateId) =>
  templatesById.get(String(templateId || "")) || null;

export const serializeTemplateMetadata = (template) => ({
  id: template.id,
  name: template.name,
  category: template.category,
  description: template.description,
  preview: template.preview,
  canvasWidth: template.canvasWidth,
  canvasHeight: template.canvasHeight,
  objectCount: template.canvasData.objects.length,
});
