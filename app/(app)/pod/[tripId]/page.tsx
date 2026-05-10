"use client";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, X, RotateCcw, Save, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useTripStore, usePodStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

const SignatureCanvas: any = dynamic(() => import("react-signature-canvas"), { ssr: false });

export default function PodCapturePage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === params.tripId));
  const setStatus = useTripStore((s) => s.setStatus);
  const addPod = usePodStore((s) => s.addPod);

  const sigRef = useRef<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [receiverName, setReceiverName] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [notes, setNotes] = useState("");

  if (!trip) return <div className="text-center py-20 text-muted-foreground">Trip not found</div>;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const clearSig = () => sigRef.current?.clear();

  const submit = () => {
    if (!receiverName) { toast.error("Receiver name is required"); return; }
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
    router.push(`/trips/${trip.id}`);
  };

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
            <div><Label>Receiver Name *</Label><Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Juan Dela Cruz" /></div>
            <div><Label>Contact (optional)</Label><Input value={receiverContact} onChange={(e) => setReceiverContact(e.target.value)} placeholder="+63 917..." /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition of cargo, remarks..." /></div>
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
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Receiver Signature *</CardTitle>
          <Button size="sm" variant="ghost" onClick={clearSig}><RotateCcw className="w-3 h-3" /> Clear</Button>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-brand-border rounded-xl bg-white">
            <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-48 rounded-xl" }} penColor="#0B1220" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><MapPin className="w-3 h-3" /> GPS: {trip.dropoff.lat.toFixed(4)}, {trip.dropoff.lng.toFixed(4)} · Auto-timestamped</div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={submit} className="shadow-glow"><Save className="w-4 h-4" /> Save POD</Button>
      </div>
    </div>
  );
}
