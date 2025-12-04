import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

type ProfileForm = z.infer<typeof profileSchema>;

// Helper functions for profile auto-save
const getSavedProfile = (email: string): ProfileForm | null => {
  try {
    const saved = localStorage.getItem(`nae-profile-${email}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveProfile = (email: string, profile: ProfileForm) => {
  try {
    localStorage.setItem(`nae-profile-${email}`, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
};

export default function ProfileSetup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewInitials, setPreviewInitials] = useState("");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Load saved profile when component mounts
  useEffect(() => {
    if (user?.email) {
      const savedProfile = getSavedProfile(user.email);
      if (savedProfile) {
        form.setValue("firstName", savedProfile.firstName);
        form.setValue("lastName", savedProfile.lastName);
        // Update preview initials
        const initials = `${savedProfile.firstName[0].toUpperCase()}${savedProfile.lastName[0].toUpperCase()}`;
        setPreviewInitials(initials);
      }
    }
  }, [user?.email, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return await apiRequest("POST", "/api/auth/complete-profile", data);
    },
    onSuccess: () => {
      // Save profile to localStorage for future auto-fill
      if (user?.email) {
        saveProfile(user.email, form.getValues());
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Complete",
        description: "Your profile has been set up successfully and saved for future use",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormChange = () => {
    const firstName = form.watch("firstName");
    const lastName = form.watch("lastName");

    if (firstName && lastName) {
      const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
      setPreviewInitials(initials);
    } else {
      setPreviewInitials("");
    }
  };

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Your name will be used to generate reference numbers for test sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Collen"
                        data-testid="input-first-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Gillen"
                        data-testid="input-last-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {previewInitials && (
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <span className="text-sm font-medium text-muted-foreground">Your Reference Prefix:</span>
                  <div className="text-2xl font-mono font-bold text-foreground mt-2">
                    {previewInitials}01
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: {previewInitials}01-CSM S64-Zi12441640
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12"
                size="lg"
                disabled={updateProfileMutation.isPending}
                data-testid="button-complete-profile"
              >
                {updateProfileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
