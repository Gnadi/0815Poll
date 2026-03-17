"use client";

import { useRouter } from "next/navigation";
import { LayoutList, Calendar, MapPin, Palette, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

interface PollTypeOption {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  label: string;
}

const pollTypes: PollTypeOption[] = [
  {
    icon: <LayoutList className="h-6 w-6 text-primary" />,
    title: "Standard Poll",
    description:
      "Create a simple poll with multiple choice options. Great for quick votes and gathering opinions.",
    href: "/create/standard",
    label: "Standard",
  },
  {
    icon: <Calendar className="h-6 w-6 text-primary" />,
    title: "Schedule Poll",
    description:
      "Find the best time that works for everyone. Perfect for meetings, events, and group activities.",
    href: "/create/schedule",
    label: "Schedule",
  },
  {
    icon: <MapPin className="h-6 w-6 text-primary" />,
    title: "Location Poll",
    description:
      "Let your group decide on the best place. Ideal for choosing restaurants, venues, or destinations.",
    href: "/create/location",
    label: "Location",
  },
  {
    icon: <Palette className="h-6 w-6 text-primary" />,
    title: "Custom Poll",
    description:
      "Build a fully customized poll with advanced options, images, and flexible response types.",
    href: "/create/custom",
    label: "Custom",
  },
];

export default function CreatePollPage() {
  const router = useRouter();

  return (
    <>
      <Header title="Create New Poll" showBack />
      <PageContainer>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text">Choose a poll format</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Pick the type of poll that best fits your needs.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {pollTypes.map((type) => (
            <Card
              key={type.href}
              onClick={() => router.push(type.href)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  {type.icon}
                </div>
                <h3 className="text-base font-semibold text-text">
                  {type.title}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-text-secondary">
                {type.description}
              </p>

              <Button
                variant="primary"
                size="sm"
                className="self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(type.href);
                }}
              >
                Select {type.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
