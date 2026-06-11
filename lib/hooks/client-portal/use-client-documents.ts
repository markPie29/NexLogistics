import { useMemo } from "react";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { useClientTrips } from "./use-client-trips";
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type PortalDocument,
} from "@/lib/utils/client-portal";

/**
 * Returns portal documents filtered by the authenticated client's trip IDs.
 * Includes documents tied to one of the client's trips, plus general documents
 * (those with no tripId).
 *
 * Also provides category grouping helpers for the Documents page.
 *
 * Validates: Requirements 11.1, 11.2
 */
export function useClientDocuments() {
  const { trips } = useClientTrips();
  const storeDocuments = useClientPortalStore((s) => s.documents);

  // Build a set of the client's trip IDs for fast lookup
  const clientTripIds = useMemo(
    () => new Set(trips.map((t) => t.id)),
    [trips]
  );

  // Filter documents: include those linked to one of the client's trips,
  // or those with no tripId (general/shared documents).
  // Cast to PortalDocument from utils since the store type may not yet include tripId (task 3.3).
  const clientDocuments: PortalDocument[] = useMemo(() => {
    const docs = (storeDocuments ?? []) as unknown as PortalDocument[];
    return docs.filter(
      (doc) => !doc.tripId || clientTripIds.has(doc.tripId)
    );
  }, [storeDocuments, clientTripIds]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped: Record<DocumentCategory, PortalDocument[]> = {
      Delivery: [],
      Compliance: [],
      Financial: [],
      Rate: [],
    };

    for (const doc of clientDocuments) {
      const category = doc.category as DocumentCategory;
      if (category in grouped) {
        grouped[category].push(doc);
      }
    }

    return grouped;
  }, [clientDocuments]);

  // Get available categories (those with at least one document)
  const availableCategories = useMemo(
    () =>
      (Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).filter(
        (cat) => documentsByCategory[cat].length > 0
      ),
    [documentsByCategory]
  );

  return {
    documents: clientDocuments,
    documentsByCategory,
    availableCategories,
  };
}
