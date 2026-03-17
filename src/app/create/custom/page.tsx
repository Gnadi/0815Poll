'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import {
  Palette,
  X,
  Plus,
  Clock,
  ChevronRight,
  Image,
  Type,
  AlignLeft,
} from 'lucide-react';
import { getVoterId } from '@/lib/utils';

interface CustomOption {
  label: string;
  description: string;
  color: string;
}

const COLORS = [
  '#5B5FE6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

export default function CreateCustomPollPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<CustomOption[]>([
    { label: '', description: '', color: COLORS[0] },
    { label: '', description: '', color: COLORS[1] },
  ]);
  const [anonymous, setAnonymous] = useState(true);
  const [duration, setDuration] = useState(24);
  const [showDuration, setShowDuration] = useState(false);
  const [allowDescription, setAllowDescription] = useState(true);
  const [loading, setLoading] = useState(false);

  const durations = [
    { label: '1 hour', value: 1 },
    { label: '6 hours', value: 6 },
    { label: '12 hours', value: 12 },
    { label: '24 hours', value: 24 },
    { label: '48 hours', value: 48 },
    { label: '7 days', value: 168 },
  ];

  const updateOption = (index: number, field: keyof CustomOption, value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([
      ...options,
      { label: '', description: '', color: COLORS[options.length % COLORS.length] },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    const validOptions = options.filter((o) => o.label.trim());
    if (validOptions.length < 2) return;

    setLoading(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          question: question.trim(),
          description: description.trim() || undefined,
          anonymous,
          duration,
          options: validOptions.map((o) => o.label),
          optionMetadata: validOptions.map((o) =>
            JSON.stringify({
              description: o.description,
              color: o.color,
            })
          ),
          creatorId: getVoterId(),
        }),
      });
      const data = await res.json();
      router.push(`/poll/${data.id}`);
    } catch {
      setLoading(false);
    }
  };

  const durationLabel = durations.find((d) => d.value === duration)?.label || '24 hours';

  return (
    <>
      <Header title="Create Custom Poll" showBack />
      <PageContainer>
        <div className="space-y-6">
          {/* Toolbar */}
          <Card className="!p-2">
            <div className="flex items-center gap-1">
              <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-primary-50 text-primary">
                <Type className="w-4 h-4" />
                <span className="text-[10px] font-medium">Text</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-gray-50 text-text-muted">
                <Image className="w-4 h-4" />
                <span className="text-[10px] font-medium">Media</span>
              </button>
              <button
                onClick={() => setAllowDescription(!allowDescription)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  allowDescription ? 'bg-primary-50 text-primary' : 'hover:bg-gray-50 text-text-muted'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span className="text-[10px] font-medium">Details</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-gray-50 text-text-muted">
                <Palette className="w-4 h-4" />
                <span className="text-[10px] font-medium">Colors</span>
              </button>
            </div>
          </Card>

          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Poll Question
            </h2>
            <Input
              multiline
              rows={3}
              placeholder="Ask something creative..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Description (optional)"
              multiline
              rows={2}
              placeholder="Provide context for your poll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Custom Options
              </h2>
              <span className="text-xs text-text-muted">Min. 2 options</span>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: option.color }}
                  />
                  <div className="pl-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-text-muted"
                        />
                        {allowDescription && (
                          <input
                            type="text"
                            placeholder="Add description..."
                            value={option.description}
                            onChange={(e) =>
                              updateOption(index, 'description', e.target.value)
                            }
                            className="w-full text-xs text-text-secondary bg-transparent outline-none placeholder:text-text-muted"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Color picker */}
                        <div className="relative">
                          <button
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: option.color }}
                          />
                        </div>
                        {options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="text-text-muted hover:text-danger transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Color selector row */}
                    <div className="flex gap-1.5 mt-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateOption(index, 'color', color)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            option.color === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-300' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <button
              onClick={addOption}
              className="w-full mt-3 py-3 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add another option
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Settings
            </h2>
            <div className="space-y-3">
              <Card>
                <Toggle
                  checked={anonymous}
                  onChange={setAnonymous}
                  label="Anonymous Results"
                  description="Hide voter identities"
                />
              </Card>

              <Card className="cursor-pointer" onClick={() => setShowDuration(!showDuration)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Poll Duration</p>
                    <p className="text-xs text-text-secondary">{durationLabel}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
                {showDuration && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDuration(d.value);
                          setShowDuration(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          duration === d.value
                            ? 'bg-primary text-white'
                            : 'bg-primary-50 text-primary hover:bg-primary-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            loading={loading}
            disabled={!question.trim() || options.filter((o) => o.label.trim()).length < 2}
          >
            Create Custom Poll
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
