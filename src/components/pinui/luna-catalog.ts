export type LunaCategory = {
    label: string;
    href: string;
    description: string;
    icon: "games" | "software" | "subscriptions" | "gifts" | "assets" | "topups";
};
export type LunaLink = {
    label: string;
    href: string;
};
export type LunaProduct = LunaLink & {
    region: string;
    keywords?: string[];
};
export const LUNA_LINKS = {
    home: "#",
    store: "#store",
    categories: "#categories",
    signIn: "#sign-in",
    join: "#join",
};
export const LUNA_NAV: LunaLink[] = [
    { label: "Ưu đãi", href: "#deals" },
    { label: "Hỗ trợ", href: "#support" },
    { label: "Hỏi đáp", href: "#faq" },
];
export const LUNA_CATEGORIES: LunaCategory[] = [
    { label: "Mã game", href: "#c-game-keys", description: "Mã Steam, Epic, Xbox và PlayStation.", icon: "games" },
    {
        label: "Bản quyền phần mềm",
        href: "#c-software",
        description: "Công cụ thiết kế, bảo mật và tiện ích.",
        icon: "software",
    },
    {
        label: "Gói đăng ký",
        href: "#c-subscriptions",
        description: "Xem phim, nghe nhạc và lưu trữ đám mây.",
        icon: "subscriptions",
    },
    {
        label: "Thẻ quà tặng",
        href: "#c-gift-cards",
        description: "Số dư cho các nền tảng bạn yêu thích.",
        icon: "gifts",
    },
    {
        label: "Tài nguyên số",
        href: "#c-assets",
        description: "Mẫu, phông chữ, mô hình 3D và preset.",
        icon: "assets",
    },
    { label: "Nạp tiền", href: "#c-top-ups", description: "Tiền trong game và số dư ví.", icon: "topups" },
];
export const LUNA_PRODUCTS: LunaProduct[] = [
    { label: "Gói VPN 1 năm", href: "#p-1-year-vpn-plan", region: "Toàn cầu", keywords: ["privacy", "security"] },
    {
        label: "Bản quyền bộ công cụ thiết kế",
        href: "#p-design-suite-license",
        region: "Toàn cầu",
        keywords: ["software", "creative"],
    },
    { label: "Lưu trữ đám mây 2TB", href: "#p-cloud-storage-2tb", region: "Mỹ", keywords: ["backup", "subscription"] },
    { label: "Gói mã game", href: "#p-game-key-bundle", region: "Châu Âu", keywords: ["steam", "pc"] },
];
