"use client";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Camera, X, RotateCcw, Save, MapPin, ChevronLeft, CheckCircle2,
  User, Phone, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useTripStore, usePodStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SignatureCanvas: any = dynamic(() => import("react-signature-canvas"), { ssr: false });

export default function PodCapturePage() {
  const params    = useParams<{ tripId: string }>();
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const trip      = useTripStore((s) => s.trips.find((t) => t.id === params.tripId));
  const setStatus = useTripStore((s) => s.setStatus);
  const addPod    = usePodStore((s) => s.addPod);

  const sigRef = useRef<any>(null);
  const [photos,          setPhotos]          = useState<string[]>([]);
  const [receiverName,    setReceiverName]    = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [notes,           setNotes]           = useState("");

  if (!trip) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Trip not found</p>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const clearSig    = () => sigRef.current?.clear();

  const submit = () => {
    if (!receiverName)             { toast.error("Receiver name is required"); return; }
    if (sigRef.current?.isEmpty()) { toast.error("Signature is required"); return; }
    const signatureDataUrl = sigRef.current.toDataURL("image/png");
    addPod({
      tripId: trip.id,
      receiverName,
      receiverContact: receiverContact || undefined,
      signatureDataUrl,
      photoDataUrls: photos,
      notes: notes || undefined,
      gps: { lat: trip.dropoff.lat, lng: trip.dropoff.lng },
    });
    if (trip.status !== "completed") setStatus(trip.id, "completed", "driver", "POD captured");
    toast.success("Proof of delivery captured!");
    router.push(user?.role === "driver" ? "/pod" : `/trips/${trip.id}`);
  };

  // ── Driver mobile view ── full DVH, safe areas, brand tokens
  if (user?.role === "driver") {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col bg-gray-50 overscroll-none">

        {/* ── Sticky header ── */}
        <header
          className="sticky top-0 z-30 bg-brand-navy w-full shrink-0"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between gap-3">
            <button
              onClick={() => router.push("/pod")}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 shrink-0"
              aria-label="Back to POD"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <p className="text-white font-bold text-sm leading-tight truncate">Capture POD</p>
              <p className="text-[11px] text-white/50 truncate">
                {trip.id} &middot; {trip.dropoff.address.split(",")[0]}
              </p>
            </div>
            <div className="text-center leading-none select-none shrink-0 min-w-[44px] flex flex-col items-center">
              <p className="text-white font-extrabold text-sm tracking-tight">
                NE<span className="text-brand-teal">X</span>
              </p>
              <p className="text-[8px] tracking-[0.25em] text-brand-teal/80 font-semibold">
                LOGISTICS
              </p>
            </div>
          </div>
        </header>

        {/* ── Scrollable form ── */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 pb-36">

            {/* Delivery summary */}
            <div className="bg-brand-navy rounded-2xl p-4">
              <div className="flex gap-3 items-stretch">
                <div className="flex flex-col items-center pt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-400/60 shrink-0" />
                  <span className="w-0.5 flex-1 bg-white/20 my-1" />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-white ring-1 ring-red-400/60 shrink-0" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide">Pick-up</p>
                    <p className="text-sm font-semibold text-white leading-tight">
                      {trip.pickup.address.split(",")[0]}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide">Drop-off</p>
                    <p className="text-sm font-semibold text-white leading-tight">
                      {trip.dropoff.address.split(",")[0]}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
                <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="text-xs text-white/50">
                  GPS: {trip.dropoff.lat.toFixed(4)}, {trip.dropoff.lng.toFixed(4)} &bull; Auto-timestamped
                </span>
              </div>
            </div>

            {/* Receiver info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <h3 className="font-bold text-sm text-brand-navy">Receiver Information</h3>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Receiver Name
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full min-h-[48px] rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact
                  <span className="text-gray-400 ml-0.5">(optional)</span>
                </label>
                <input
                  value={receiverContact}
                  onChange={(e) => setReceiverContact(e.target.value)}
                  placeholder="+63 917..."
                  type="tel"
                  inputMode="tel"
                  className="w-full min-h-[48px] rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notes
                  <span className="text-gray-400 ml-0.5">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Condition of cargo, remarks..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 text-gray-700 placeholder:text-gray-400 resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">{notes.length}/300</p>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-brand-navy">Delivery Photos</h3>
                {photos.length > 0 && (
                  <span className="text-[11px] text-brand-teal font-semibold">{photos.length} added</span>
                )}
              </div>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-brand-teal hover:bg-brand-teal/5 transition-colors active:scale-[0.99]">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-6 h-6 text-brand-teal" />
                  </div>
                  <p className="font-semibold text-sm text-brand-navy">Tap to take / upload photos</p>
                  <p className="text-xs text-gray-400 mt-0.5">Camera or photo library &bull; Multiple allowed</p>
                </div>
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square">
                      <img
                        src={p}
                        alt={`Photo ${i + 1}`}
                        className="rounded-xl w-full h-full object-cover border border-gray-100"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-brand-navy">
                  Receiver Signature <span className="text-red-500">*</span>
                </h3>
                <button
                  onClick={clearSig}
                  className="flex items-center gap-1.5 text-xs text-gray-500 font-medium px-3 py-2 rounded-lg bg-gray-100 active:scale-95 transition-transform min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">Ask the receiver to sign in the box below</p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white touch-none">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    style: { height: 200, width: "100%", display: "block", touchAction: "none" },
                  }}
                  penColor="#0B1220"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Rotate to landscape for a wider signing area
              </p>
            </div>

          </div>
        </main>

        {/* ── Sticky submit ── */}
        <div
          className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 shrink-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <button
            onClick={submit}
            className="w-full min-h-[56px] bg-brand-teal hover:opacity-90 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-navy/20"
          >
            <CheckCircle2 className="w-5 h-5" /> Save Proof of Delivery
          </button>
        </div>
      </div>
    );
  }

  // ── Admin / dispatcher view ──
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Capture Proof of Delivery"
        subtitle={`Trip ${trip.id} · ${trip.dropoff.address}`}
        breadcrumbs={[{ label: "POD", href: "/pod" }, { label: trip.id }]}
      />

      <Card>
        <CardHeader><CardTitle>Receiver Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Receiver Name *</Label>
              <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <Label>Contact (optional)</Label>
              <Input value={receiverContact} onChange={(e) => setReceiverContact(e.target.value)} placeholder="+63 917..." />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition of cargo, remarks..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
        <CardContent>
          <label className="cursor-pointer">
            <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            <div className="border-2 border-dashed border-brand-border rounded-xl p-8 text-center hover:border-brand-teal hover:bg-brand-teal-light/30 transition">
              <Camera className="w-8 h-8 text-brand-teal mx-auto mb-2" />
              <div className="font-medium text-brand-navy">Tap to upload photos</div>
              <div className="text-xs text-muted-foreground">JPG, PNG · Multiple allowed</div>
            </div>
          </label>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
              {photos.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt={`Photo ${i + 1}`} className="rounded-lg border border-brand-border w-full aspect-square object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Receiver Signature *</CardTitle>
          <Button size="sm" variant="ghost" onClick={clearSig}><RotateCcw className="w-3 h-3 mr-1" /> Clear</Button>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-brand-border rounded-xl bg-white">
            <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-48 rounded-xl" }} penColor="#0B1220" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3" /> GPS: {trip.dropoff.lat.toFixed(4)}, {trip.dropoff.lng.toFixed(4)} · Auto-timestamped
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={submit} className="shadow-glow"><Save className="w-4 h-4 mr-1" /> Save POD</Button>
      </div>
    </div>
  );
}