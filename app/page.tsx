import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroCarousel } from "@/components/features/landing/hero-carousel";
import {
  LANDING_FEATURES,
  LANDING_HERO_SLIDES,
  LANDING_STEPS,
  LANDING_TESTIMONIALS,
} from "@/lib/landing";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const year = new Date().getFullYear();
  const heroSlides = LANDING_HERO_SLIDES.map(({ key, src }) => ({
    src,
    alt: t(`hero.carousel.slides.${key}.alt`),
  }));

  return (
    <div className="flex flex-col pt-16">
      <section className="mt-20 pb-12 space-y-10 md:space-y-15 px-5">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {t("hero.badge")}
          </Badge>

          <h1 className="gradient-title mx-auto max-w-6xl text-4xl font-bold md:text-8xl">
            {t("hero.title")}
          </h1>

          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <Link href="/dashboard">
                {t("hero.ctaStart")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Link href="#how-it-works">{t("hero.ctaHowItWorks")}</Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto max-w-3xl overflow-hidden rounded-xl shadow-xl">
          <HeroCarousel
            slides={heroSlides}
            prevLabel={t("hero.carousel.prevSlide")}
            nextLabel={t("hero.carousel.nextSlide")}
            goToSlideLabel={t("hero.carousel.goToSlide")}
          />
        </div>
      </section>

      <section id="features" className="bg-muted py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {t("featuresSection.badge")}
          </Badge>
          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            {t("featuresSection.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            {t("featuresSection.subtitle")}
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURES.map(({ key, Icon, bg, color }) => (
              <Card
                key={key}
                className="flex flex-col items-center space-y-4 p-6 text-center"
              >
                <div className={`rounded-full p-3 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>

                <h3 className="text-xl font-bold">
                  {t(`featuresSection.${key}.title`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`featuresSection.${key}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {t("howItWorksSection.badge")}
          </Badge>
          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            {t("howItWorksSection.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            {t("howItWorksSection.subtitle")}
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {LANDING_STEPS.map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                  {label}
                </div>
                <h3 className="text-xl font-bold">
                  {t(`howItWorksSection.${key}.title`)}
                </h3>
                <p className="text-muted-foreground text-center">
                  {t(`howItWorksSection.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {t("testimonialsSection.badge")}
          </Badge>
          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            {t("testimonialsSection.title")}
          </h2>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LANDING_TESTIMONIALS.map(({ key, name, image }) => (
              <Card key={key} className="flex flex-col justify-between">
                <CardContent className="space-y-4 p-6">
                  <p className="text-muted-foreground">
                    {t(`testimonialsSection.${key}.quote`)}
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={image} alt={name} />
                      <AvatarFallback className="uppercase">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`testimonialsSection.${key}.role`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 gradient">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            {t("ctaSection.title")}
          </h2>
          <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed">
            {t("ctaSection.subtitle")}
          </p>
          <Button asChild size="lg" className="bg-green-800 hover:opacity-90">
            <Link href="/dashboard">
              {t("ctaSection.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-muted py-12 text-center text-sm text-muted-foreground">
        {t("footer.copyright", { year })}
      </footer>
    </div>
  );
}
