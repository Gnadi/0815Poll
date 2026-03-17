"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Toggle from "@/components/ui/Toggle";

const DURATION_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "48h", label: "48 hours" },
  { value: "7d", label: "7 days" },
];

export default function CreateStandardPollPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [anonymous, setAnonymous] = useState(false);
  const [duration, setDuration] = useState("24h");
  const [showDurationSelect, setShowDurationSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>(
    {},
  );

  const addOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
    if (errors.options) {
      setErrors((prev) => ({ ...prev, options: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!question.trim()) {
      newErrors.question = "Please enter a poll question";
    }

    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      newErrors.options = "Please provide at least 2 options";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "standard",
          question: question.trim(),
          options: options.filter((o) => o.trim()).map((o) => o.trim()),
          anonymous,
          duration,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create poll");
      }

      const data = await res.json();
      router.push(`/poll/${data.id}`);
    } catch {
      setErrors({ question: "Something went wrong. Please try again." });
      setLoading(false);
    }
  };

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration;

  return (
    <>
      <Header title="Create Poll" showBack />
      <PageContainer>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          {/* Poll Question */}
          <Input
            label="Poll Question"
            multiline
            rows={3}
            placeholder="What's on your mind? e.g. Best place for Friday lunch?"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (errors.question) {
                setErrors((prev) => ({ ...prev, question: undefined }));
              }
            }}
            error={errors.question}
          />

          {/* Poll Options */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">
                Poll Options
              </span>
              <span className="text-xs text-text-muted">Min. 2 options</span>
            </div>

            {errors.options && (
              <p className="text-xs text-danger">{errors.options}</p>
            )}

            <div className="flex flex-col gap-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add another option
            </button>
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text">Settings</span>

            <Card className="flex flex-col gap-4">
              <Toggle
                checked={anonymous}
                onChange={setAnonymous}
                label="Anonymous Results"
                description="Hide voter identities"
              />

              {/* Duration selector */}
              <div className="border-t border-border pt-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDurationSelect((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl bg-background px-4 py-3 text-left transition-colors hover:bg-primary-50"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-text">
                          Poll Duration
                        </p>
                        <p className="text-xs text-text-muted">
                          {durationLabel}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 text-text-muted transition-transform ${showDurationSelect ? "rotate-90" : ""}`}
                    />
                  </button>

                  {showDurationSelect && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDuration(opt.value);
                            setShowDurationSelect(false);
                          }}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            duration === opt.value
                              ? "bg-primary text-white"
                              : "bg-background text-text-secondary hover:bg-primary-50 hover:text-primary"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            Create Poll
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
