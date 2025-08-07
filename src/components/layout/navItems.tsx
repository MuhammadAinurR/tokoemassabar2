import {
  PieChart,
  Gem,
  Users,
  ShoppingCart,
  UsersRound,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
  roles?: string[];
};

export const allNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <PieChart className="h-4 w-4" />,
    roles: ["admin"],
  },
  {
    title: "Master Barang",
    href: "/master",
    icon: <Gem className="h-4 w-4" />,
    submenu: [
      {
        title: "Kategori Barang",
        href: "/master/category",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Data Supplier",
        href: "/master/supplier",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Data Customer",
        href: "/master/customer",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
    ],
    roles: ["admin"],
  },
  {
    title: "Item/Barang",
    href: "/item",
    icon: <Users className="h-4 w-4" />,
    submenu: [
      {
        title: "Stock Barang",
        href: "/item/data-barang",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Barang Masuk",
        href: "/item/barang-masuk",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Barang Keluar",
        href: "/item/barang-keluar",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
    ],
    roles: ["admin"],
  },
  {
    title: "Transaksi",
    href: "/transaksi",
    icon: <ShoppingCart className="h-4 w-4" />,
    roles: ["admin", "staff"],
    submenu: [
      {
        title: "Penjualan",
        href: "/transaksi/penjualan",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin", "staff"],
      },
      {
        title: "Pembelian",
        href: "/transaksi/pembelian",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      // {
      //   title: 'Service',
      //   href: '/transaksi/service',
      //   icon: <ChevronRight className="h-4 w-4" />,
      // },
      {
        title: "Tanggungan",
        href: "/transaksi/tanggungan",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Service",
        href: "/transaksi/service",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Operasional",
        href: "/transaksi/operasional",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Lain-lain",
        href: "/transaksi/lain-lain",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: <UsersRound className="h-4 w-4" />,
    submenu: [
      {
        title: "Laporan Barang",
        href: "/laporan/stock-barang",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Laporan KAS",
        href: "/laporan/kas",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
      {
        title: "Laporan Harian",
        href: "/laporan/harian",
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ["admin"],
      },
    ],
    roles: ["admin"],
  },
  // {
  //   title: 'Pegawai',
  //   href: '/pegawai',
  //   icon: <UsersRound className="h-4 w-4" />,
  //   submenu: [
  //     {
  //       title: 'Data Pegawai',
  //       href: '/pegawai',
  //       icon: <ChevronRight className="h-4 w-4" />,
  //     },
  //   ],
  // },
  // {
  //   title: 'User',
  //   href: '/user',
  //   icon: <Users className="h-4 w-4" />,
  //   submenu: [
  //     {
  //       title: 'Daftar User',
  //       href: '/user/admin',
  //       icon: <ChevronRight className="h-4 w-4" />,
  //     },
  //     {
  //       title: 'Level User',
  //       href: '/user/level-user',
  //       icon: <ChevronRight className="h-4 w-4" />,
  //     },
  //     {
  //       title: 'Level Akses',
  //       href: '/user/level-akses',
  //       icon: <ChevronRight className="h-4 w-4" />,
  //     },
  //   ],
  // },
];

export function getFilteredNavItems(userRole: string | null): NavItem[] {
  if (!userRole) return [];

  return allNavItems.reduce<NavItem[]>((acc, item) => {
    if (item.roles?.includes(userRole)) {
      const filteredItem = { ...item };

      if (item.submenu) {
        filteredItem.submenu = item.submenu.filter((subItem) =>
          subItem.roles?.includes(userRole)
        );
      }

      acc.push(filteredItem);
    }
    return acc;
  }, []);
}
