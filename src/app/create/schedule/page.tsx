"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Clock,
  Calendar,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Toggle from "@/components/ui/Toggle";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

const DEFAULT_TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

const DURATION_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "48h", label: "48 hours" },
  { value: "7d", label: "7 days" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" key for a Date */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isPast(d: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const compare = new Date(d);
  compare.setHours(0, 0, 0, 0);
  return compare < now;
}

/** Number of days in month (0-indexed month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Day-of-week the 1st falls on (0 = Sun). */
function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateLabel(key: string): string {
  const d = parseKey(key);
  return `${SHORT_DAY_NAMES[d.getDay()]}, ${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]}`;
}

function formatDateLong(key: string): string {
  const d = parseKey(key);
  return `${SHORT_DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function CreateSchedulePollPage() {
  const router = useRouter();

  // Multi-step state
  const [step, setStep] = useState(1);

  // Step 1 state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timeSlotsByDate, setTimeSlotsByDate] = useState<
    Record<string, string[]>
  >({});
  const [activeDateTab, setActiveDateTab] = useState<string | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Step 2 state
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [duration, setDuration] = useState("24h");
  const [showDurationSelect, setShowDurationSelect] = useState(false);

  // Submission
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Derived values ──

  const sortedDates = useMemo(
    () => [...selectedDates].sort(),
    [selectedDates],
  );

  const totalTimeSlots = useMemo(() => {
    return Object.values(timeSlotsByDate).reduce(
      (sum, slots) => sum + slots.length,
      0,
    );
  }, [timeSlotsByDate]);

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration;

  // All date+time combos for review
  const allCombos = useMemo(() => {
    const combos: { date: string; time: string; label: string }[] = [];
    for (const dk of sortedDates) {
      const slots = timeSlotsByDate[dk] ?? [];
      for (const time of slots) {
        combos.push({
          date: dk,
          time,
          label: `${formatDateLabel(dk)} - ${time}`,
        });
      }
    }
    return combos;
  }, [sortedDates, timeSlotsByDate]);

  // ── Calendar grid ──

  const calendarGrid = useMemo(() => {
    const totalDays = daysInMonth(calYear, calMonth);
    const startDay = firstDayOfMonth(calYear, calMonth);
    const rows: (number | null)[][] = [];
    let current = 1;

    // First row with leading empty cells
    const firstRow: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (i < startDay) {
        firstRow.push(null);
      } else {
        firstRow.push(current++);
      }
    }
    rows.push(firstRow);

    // Remaining rows
    while (current <= totalDays) {
      const row: (number | null)[] = [];
      for (let i = 0; i < 7; i++) {
        if (current <= totalDays) {
          row.push(current++);
        } else {
          row.push(null);
        }
      }
      rows.push(row);
    }

    return rows;
  }, [calYear, calMonth]);

  // ── Handlers ──

  const prevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const toggleDate = useCallback(
    (day: number) => {
      const d = new Date(calYear, calMonth, day);
      if (isPast(d)) return;
      const key = dateKey(d);

      setSelectedDates((prev) => {
        if (prev.includes(key)) {
          // Remove date
          setTimeSlotsByDate((ts) => {
            const copy = { ...ts };
            delete copy[key];
            return copy;
          });
          setActiveDateTab((curr) => (curr === key ? null : curr));
          return prev.filter((k) => k !== key);
        } else {
          // Add date
          setTimeSlotsByDate((ts) => ({
            ...ts,
            [key]: [],
          }));
          setActiveDateTab(key);
          return [...prev, key];
        }
      });
    },
    [calYear, calMonth],
  );

  const toggleTimeSlot = useCallback(
    (time: string) => {
      if (!activeDateTab) return;
      setTimeSlotsByDate((prev) => {
        const slots = prev[activeDateTab] ?? [];
        if (slots.includes(time)) {
          return { ...prev, [activeDateTab]: slots.filter((t) => t !== time) };
        }
        return { ...prev, [activeDateTab]: [...slots, time] };
      });
    },
    [activeDateTab],
  );

  const addCustomTime = useCallback(() => {
    const trimmed = customTimeInput.trim().toUpperCase();
    if (!trimmed || !activeDateTab) return;

    // Basic validation: accept format like "10:30 AM"
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return;

    const formatted = `${match[1].padStart(2, "0")}:${match[2]} ${match[3]}`;

    setTimeSlotsByDate((prev) => {
      const slots = prev[activeDateTab] ?? [];
      if (slots.includes(formatted)) return prev;
      return { ...prev, [activeDateTab]: [...slots, formatted] };
    });

    setCustomTimeInput("");
    setShowCustomInput(false);
  }, [customTimeInput, activeDateTab]);

  const canContinueStep1 = sortedDates.length > 0 && totalTimeSlots > 0;

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!question.trim()) {
      newErrors.question = "Please enter a poll question";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const options = allCombos.map((c) => ({
        text: c.label,
        metadata: { date: c.date, time: c.time },
      }));

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "schedule",
          question: question.trim(),
          description: description.trim() || undefined,
          options,
          anonymous,
          duration,
        }),
      });

      if (!res.ok) throw new Error("Failed to create poll");

      const data = await res.json();
      router.push(`/poll/${data.id}`);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
      setLoading(false);
    }
  };

  // ── Ensure activeDateTab is valid ──
  const effectiveDateTab =
    activeDateTab && selectedDates.includes(activeDateTab)
      ? activeDateTab
      : sortedDates[0] ?? null;

  // ── Render helpers ──

  const renderStepIndicator = () => (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">
          Step {step} of 3
        </span>
        <span className="text-xs font-medium text-primary">
          {step === 1
            ? "Date Selection"
            : step === 2
              ? "Poll Details"
              : "Review"}
        </span>
      </div>
      <ProgressBar
        percentage={(step / 3) * 100}
        size="sm"
      />
    </div>
  );

  // ─── Step 1: Date Selection ──────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="flex flex-col gap-6">
      {/* Calendar section */}
      <div>
        <h2 className="text-lg font-semibold text-text">Select Dates</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Choose multiple dates for your meeting
        </p>
      </div>

      <Card>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-text">
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center py-1 text-xs font-medium text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarGrid.flat().map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }

            const d = new Date(calYear, calMonth, day);
            const key = dateKey(d);
            const selected = selectedDates.includes(key);
            const today = isToday(d);
            const past = isPast(d);

            return (
              <button
                key={key}
                type="button"
                disabled={past}
                onClick={() => toggleDate(day)}
                className={`
                  flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${
                    selected
                      ? "bg-primary text-white shadow-sm"
                      : past
                        ? "text-text-muted/40 cursor-not-allowed"
                        : today
                          ? "bg-primary-50 text-primary hover:bg-primary-100"
                          : "text-text hover:bg-primary-50 hover:text-primary"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time slots section */}
      {sortedDates.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text">
            Select Time Slots
          </h3>

          {/* Date tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {sortedDates.map((dk) => {
              const isActive = dk === effectiveDateTab;
              return (
                <button
                  key={dk}
                  type="button"
                  onClick={() => setActiveDateTab(dk)}
                  className={`
                    shrink-0 rounded-full px-3 py-1.5 text-xs font-medium
                    transition-all duration-150 border
                    ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-text-secondary border-border hover:border-primary hover:text-primary"
                    }
                  `}
                >
                  {formatDateLabel(dk)}
                </button>
              );
            })}
          </div>

          {/* Time slot grid */}
          {effectiveDateTab && (
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_TIME_SLOTS.map((time) => {
                const selected = (
                  timeSlotsByDate[effectiveDateTab] ?? []
                ).includes(time);

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeSlot(time)}
                    className={`
                      flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium
                      transition-all duration-150 border
                      ${
                        selected
                          ? "border-primary bg-primary-50 text-primary"
                          : "border-border bg-surface text-text-secondary hover:border-primary-200 hover:text-text"
                      }
                    `}
                  >
                    <span>{time}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}

              {/* Custom time slots for this date */}
              {(timeSlotsByDate[effectiveDateTab] ?? [])
                .filter((t) => !DEFAULT_TIME_SLOTS.includes(t))
                .map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeSlot(time)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 border border-primary bg-primary-50 text-primary"
                  >
                    <span>{time}</span>
                    <Check className="h-4 w-4 text-primary" />
                  </button>
                ))}

              {/* Add Custom button / input */}
              {showCustomInput ? (
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 06:30 PM"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTime();
                      }
                    }}
                    className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addCustomTime}
                    type="button"
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTimeInput("");
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selection summary */}
      {sortedDates.length > 0 && (
        <Card className="bg-primary-50 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">
                Selection Summary
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {sortedDates.length} date{sortedDates.length !== 1 ? "s" : ""},
                {" "}
                {totalTimeSlots} time slot
                {totalTimeSlots !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-1">
              {sortedDates.slice(0, 5).map((dk) => {
                const d = parseKey(dk);
                return (
                  <span
                    key={dk}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
                  >
                    {d.getDate()}
                  </span>
                );
              })}
              {sortedDates.length > 5 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-200 text-xs font-semibold text-primary">
                  +{sortedDates.length - 5}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Continue button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canContinueStep1}
        onClick={() => setStep(2)}
        type="button"
      >
        Continue to Step 2
      </Button>
    </div>
  );

  // ─── Step 2: Poll Details ────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="flex flex-col gap-6">
      <Input
        label="Poll Question"
        multiline
        rows={3}
        placeholder="e.g. When should we schedule the team meeting?"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          if (errors.question) {
            setErrors((prev) => {
              const copy = { ...prev };
              delete copy.question;
              return copy;
            });
          }
        }}
        error={errors.question}
      />

      <Input
        label="Description (optional)"
        multiline
        rows={3}
        placeholder="Add more context about this meeting..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Settings */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-text">Settings</span>

        <Card className="flex flex-col gap-4">
          <Toggle
            checked={anonymous}
            onChange={setAnonymous}
            label="Anonymous Responses"
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
                    <p className="text-xs text-text-muted">{durationLabel}</p>
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

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => setStep(1)}
          type="button"
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={() => {
            if (validateStep2()) setStep(3);
          }}
          type="button"
        >
          Continue to Step 3
        </Button>
      </div>
    </div>
  );

  // ─── Step 3: Review & Create ─────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="flex flex-col gap-6">
      {/* Question preview */}
      <Card>
        <h3 className="text-sm font-medium text-text-muted mb-1">
          Poll Question
        </h3>
        <p className="text-base font-semibold text-text">{question}</p>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </Card>

      {/* Settings preview */}
      <Card className="flex items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            <Calendar className="h-3 w-3 mr-1 inline" />
            {sortedDates.length} date{sortedDates.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="default">
            <Clock className="h-3 w-3 mr-1 inline" />
            {totalTimeSlots} time slot{totalTimeSlots !== 1 ? "s" : ""}
          </Badge>
          {anonymous && <Badge variant="outline">Anonymous</Badge>}
          <Badge variant="outline">{durationLabel}</Badge>
        </div>
      </Card>

      {/* Selected dates summary */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-text">
          Schedule Options ({allCombos.length})
        </h3>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {sortedDates.map((dk) => {
            const slots = timeSlotsByDate[dk] ?? [];
            if (slots.length === 0) return null;

            return (
              <Card key={dk} className="!p-3">
                <p className="text-sm font-semibold text-text mb-2">
                  {formatDateLong(dk)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((time) => (
                    <span
                      key={time}
                      className="inline-flex items-center rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {errors.submit && (
        <p className="text-sm text-danger text-center">{errors.submit}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => setStep(2)}
          type="button"
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          loading={loading}
          disabled={loading}
          onClick={handleSubmit}
          type="button"
        >
          Create Schedule Poll
        </Button>
      </div>
    </div>
  );

  // ─── Main render ─────────────────────────────────────────────────────────

  const headerRight =
    step === 1 ? (
      <button
        type="button"
        onClick={() => {
          if (canContinueStep1) setStep(2);
        }}
        className={`text-sm font-medium ${canContinueStep1 ? "text-primary" : "text-text-muted"}`}
      >
        Next
      </button>
    ) : undefined;

  return (
    <>
      <Header
        title="Create Scheduling Poll"
        rightAction={
          <div className="flex items-center gap-2">
            {headerRight}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      />
      <PageContainer>
        {renderStepIndicator()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </PageContainer>
    </>
  );
}
