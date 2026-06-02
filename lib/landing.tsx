import { Bell, CreditCard, PieChart, Receipt, Users } from "lucide-react";

export const FEATURES = [
  {
    title: "Ryhmäkulut",
    Icon: Users,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Luo ryhmiä kämppäkavereille, matkoille tai tapahtumille ja pidä kulut järjestyksessä.",
  },
  {
    title: "Älykkäät tilitykset",
    Icon: CreditCard,
    bg: "bg-teal-100",
    color: "text-teal-600",
    description:
      "Algoritmimme minimoi maksujen määrän tilien tasoittamisessa.",
  },
  {
    title: "Kuluanalyysi",
    Icon: PieChart,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Seuraa kulutustottumuksia ja löydä oivalluksia yhteisistä kuluistasi.",
  },
  {
    title: "Maksumuistutukset",
    Icon: Bell,
    bg: "bg-amber-100",
    color: "text-amber-600",
    description:
      "Automaattiset muistutukset avoimista veloista ja oivalluksia kulutuksesta.",
  },
  {
    title: "Useita jakotapoja",
    Icon: Receipt,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Jaa tasan, prosenttiosuuksilla tai tarkoilla summilla – sopii mihin tahansa tilanteeseen.",
  },
  {
    title: "Reaaliaikaiset päivitykset",
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 14v8M15 14v8M9 2v6M15 2v6" />
      </svg>
    ),
    bg: "bg-teal-100",
    color: "text-teal-600",
    description:
      "Näe uudet kulut ja maksut heti, kun ystäväsi lisäävät ne.",
  },
];

export const STEPS = [
  {
    label: "1",
    title: "Luo tai liity ryhmään",
    description:
      "Perusta ryhmä kämppäkavereille, matkalle tai tapahtumaan ja kutsu ystäviä mukaan.",
  },
  {
    label: "2",
    title: "Lisää kuluja",
    description:
      "Kirjaa kuka maksoi ja miten lasku jaetaan jäsenten kesken.",
  },
  {
    label: "3",
    title: "Tasaa tilit",
    description:
      "Katso kuka on kenelle velkaa ja kirjaa maksut, kun velat on maksettu.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "Splittaan avulla en enää mene sekaisin siitä, kuka maksoi mitäkin!",
    name: "Babu Rao",
    image: "/testimonials/babubhaiya.png",
    role: "Vuokra-asuntojen hoitaja",
  },
  {
    quote:
      "Splittaan laskelmat ovat niin tarkkoja, että ne päihittävät jopa parhaat sijoitusvinkkini!",
    name: "Raju",
    image: "/testimonials/raju.jpg",
    role: "Pörssiasiantuntija",
  },
  {
    quote:
      "Jos minulla olisi ollut Splittaa aiemmin, Raju ei olisi päässyt myymään kenkiäni ja takkiani! Lisään velan heti listalle.",
    name: "Shyam",
    image: "/testimonials/shyam.png",
    role: "Työnhakija",
  },
];
