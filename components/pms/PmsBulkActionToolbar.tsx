"use client";

import * as React from "react";
import { CheckCircle2, Trash2, Download, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * Props for the PMS Bulk Action Toolbar component.
 *
 * Requirements: 4.1-4.8, 15.10
 */
export interface PmsBulkActionToolbarProps {
  selectedCount: number;
  onMarkComplete: () => void;
  onDelete: () => void;
  onExportSelected: () => void;
  onClearSelection: () => void;
}

/**
 * Toolbar that appears when one or more PMS records are selected.
 * Provides bulk actions: Mark Complete, Delete (with confirmation), and Export Selected.
 *
 * Requirements: 4.1-4.8, 15.10
 */
export function PmsBulkActionToolbar({
  selectedCount,
  onMarkComplete,
  onDelete,
  onExportSelected,
  onClearSelection,
}: PmsBulkActionToolbarProps) {
  if (selectedCount <= 0) return null;

  return (
    <Card
      className="bg-brand-teal-light border-brand-teal/30"
      aria-live="polite"
    >
      <CardContent className="flex flex-row items-center gap-3 p-3">
        {/* Selection info and clear button */}
        <span className="text-sm font-medium text-brand-navy">
          {selectedCount} item(s) selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <Button variant="default" size="sm" onClick={onMarkComplete}>
          <CheckCircle2 className="h-4 w-4" />
          Mark Complete
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedCount} record(s)? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline" size="sm" onClick={onExportSelected}>
          <Download className="h-4 w-4" />
          Export Selected
        </Button>
      </CardContent>
    </Card>
  );
}
