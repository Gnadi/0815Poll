'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import { MapPin, X, Plus, Clock, ChevronRight } from 'lucide-react';
import { getVoterId } from '@/lib/utils';

interface LocationOption {
  name: string;
  address: string;
}

export default function CreateLocationPollPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([
    { name: '', address: '' },
    { name: '', address: '' },
  ]);
  const [anonymous, setAnonymous] = useState(true);
  const [duration, setDuration] = useState(24);
  const [showDuration, setShowDuration] = useState(false);
  const [loading, setLoading] = useState(false);

  const durations = [
    { label: '1 hour', value: 1 },
    { label: '6 hours', value: 6 },
    { label: '12 hours', value: 12 },
    { label: '24 hours', value: 24 },
    { label: '48 hours', value: 48 },
    { label: '7 days', value: 168 },
  ];

  const updateLocation = (index: number, field: keyof LocationOption, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', address: '' }]);
  };

  const removeLocation = (index: number) => {
    if (locations.length <= 2) return;
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    const validLocations = locations.filter((l) => l.name.trim());
    if (validLocations.length < 2) return;

    setLoading(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'location',
          question: question.trim(),
          description: description.trim() || undefined,
          anonymous,
          duration,
          options: validLocations.map((l) => l.name),
          optionMetadata: validLocations.map((l) =>
            JSON.stringify({ address: l.address })
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
      <Header title="Create Location Poll" showBack />
      <PageContainer>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Poll Question
              </h2>
            </div>
            <Input
              multiline
              rows={3}
              placeholder="Where should we meet? e.g. Best venue for team dinner?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Description (optional)"
              multiline
              rows={2}
              placeholder="Add more context about the meetup..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Locations
              </h2>
              <span className="text-xs text-text-muted">Min. 2 locations</span>
            </div>

            <div className="space-y-3">
              {locations.map((location, index) => (
                <Card key={index} className="relative">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder={`Location ${index + 1} name`}
                        value={location.name}
                        onChange={(e) => updateLocation(index, 'name', e.target.value)}
                        className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-text-muted"
                      />
                      <input
                        type="text"
                        placeholder="Address (optional)"
                        value={location.address}
                        onChange={(e) => updateLocation(index, 'address', e.target.value)}
                        className="w-full text-xs text-text-secondary bg-transparent outline-none placeholder:text-text-muted"
                      />
                    </div>
                    {locations.length > 2 && (
                      <button
                        onClick={() => removeLocation(index)}
                        className="text-text-muted hover:text-danger transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <button
              onClick={addLocation}
              className="w-full mt-3 py-3 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add another location
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
            disabled={!question.trim() || locations.filter((l) => l.name.trim()).length < 2}
          >
            Create Location Poll
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
