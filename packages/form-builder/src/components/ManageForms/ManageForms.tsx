import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useActivityStore } from "../../hooks/useActivityStore";
import { ActivityCard } from "./ActivityCard";
import { ActivityPreview } from "./ActivityPreview";
import { useVoiceAgentContext } from "../../voice/VoiceAgentContext";

export function ManageForms() {
  const navigate = useNavigate();
  const {
    activities,
    selectedActivityId,
    loadFromLocalStorage,
    addActivity,
    removeActivity,
    toggleActivity,
    selectActivity,
  } = useActivityStore();

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { actions: { setStage } } = useVoiceAgentContext();
  useEffect(() => { setStage("manage-forms"); }, []);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  const filteredActivities = activities.filter(
    (a) =>
      (a.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAddActivity = () => {
    if (!newName.trim()) {
      toast.error("Please enter an activity name");
      return;
    }
    const activity = addActivity(newName.trim(), newDescription.trim());
    setShowAddDialog(false);
    setNewName("");
    setNewDescription("");
    toast.success(`"${activity.name}" created`);
    navigate(`/form-builder/${activity.id}`);
  };

  const handleEdit = (activityId: string) => {
    navigate(`/form-builder/${activityId}`);
  };

  const handleDelete = (id: string) => {
    const activity = activities.find((a) => a.id === id);
    removeActivity(id);
    setShowDeleteConfirm(null);
    toast.success(`"${activity?.name}" removed`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Manage Forms
              </h1>
              <p className="text-sm text-muted-foreground">
                Select store-level activities and configure the data capture form
                for each. Click edit to customize fields.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity List */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-5">
            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Activity Cards */}
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isSelected={selectedActivityId === activity.id}
                  onSelect={() => selectActivity(activity.id)}
                  onToggle={() => toggleActivity(activity.id)}
                  onEdit={() => handleEdit(activity.id)}
                  onDelete={() => setShowDeleteConfirm(activity.id)}
                />
              ))}

              {filteredActivities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">
                    {search
                      ? "No activities match your search"
                      : "No activities yet. Click 'Add Activity' to create one."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t bg-card/80 backdrop-blur-sm px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-[380px] border-l bg-muted/20 overflow-y-auto hidden lg:flex flex-col items-center justify-center p-6">
          {selectedActivity ? (
            <ActivityPreview schema={selectedActivity.schema} />
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Select an activity to preview its form
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Activity</DialogTitle>
            <DialogDescription>
              Create a new store-level activity form. You can customize the
              fields after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Activity Name
              </label>
              <Input
                placeholder="e.g., Stock Audit"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description
              </label>
              <Input
                placeholder="Brief description of this activity..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewName("");
                  setNewDescription("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddActivity}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity?</DialogTitle>
            <DialogDescription>
              This will permanently remove this activity and its form
              configuration. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
