"use client"
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { PawPrintIcon, SearchIcon, UsersIcon, ImageIcon, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LendingPets from "@/components/lending-pets";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:py-24">
        <div className=" px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-main px-3 py-1 text-sm dark:bg-gray-800">
                Find your new best friend
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Connect with Shelters, Save a Life
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Our platform connects volunteers with animal shelters to help pets find their forever homes.
                Browse available animals, connect with shelters, and make a difference today.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="inline-flex h-10 items-center justify-center gap-2">
                  <SearchIcon className="h-4 w-4" />
                  Find Pets
                </Button>
                <Button variant="neutral" className="inline-flex h-10 items-center justify-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Become a Volunteer
                </Button>
              </div>
            </div>
            <div className="justify-center hidden lg:flex">
              <div className="relative w-[550px] h-[550px] rounded-lg bg-secondary-background overflow-hidden">
                {/* Fallback icon if image not available */}
                {/* <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div> */}

                <Image
                  src="/cats.jpg"
                  alt="Happy rescued pets"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pets Section */}
      <section className="py-12 md:py-16 bg-secondary-background">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors">
                <PawPrintIcon className="mr-1 h-3.5 w-3.5" />
                Pets Available For Lending
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Meet Our Furry Friends</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                These lovely animals are waiting for a temporary home. Could you help them out?
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-5xl py-8">
            <LendingPets />
          </div>
          <div className="flex justify-center">
            <Link href="/pets">
              <Button variant="neutral" className="mt-8">View All Pets</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform makes it easy to connect with shelters and find your perfect pet
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-main text-main-foreground dark:bg-primary dark:text-primary-foreground">
                <SearchIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Search Pets</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Browse through available pets filtered by type, location, and characteristics
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-main text-main-foreground dark:bg-primary dark:text-primary-foreground">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Connect with Shelters</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Message shelters directly to inquire about pets or schedule visits
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-main text-main-foreground dark:bg-primary dark:text-primary-foreground">
                <PawPrintIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Adopt Your Pet</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Complete the adoption process and welcome your new friend home
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shelters CTA Section */}
      <section className="py-12 md:py-16 bg-secondary-background">
        <div className=" px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">For Animal Shelters</h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join our platform to increase visibility for your shelter and animals.
                Create profiles for your pets, manage adoption requests, and connect with volunteers.
              </p>
              <Button className="inline-flex h-10 items-center justify-center">
                Register Your Shelter
              </Button>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">For Volunteers</h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Help animals find their forever homes by volunteering.
                Browse listings, save favorites, and contact shelters directly.
              </p>
              <Button className="inline-flex h-10 items-center justify-center" variant="neutral">
                Become a Volunteer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-10">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <PawPrintIcon className="h-6 w-6" />
              BEST Shelter
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Connecting shelters and pet lovers since 2025
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
