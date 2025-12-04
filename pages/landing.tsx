import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Zap, Shield, Download, Mail, Loader2, History } from "lucide-react";
import { isAllowedEmailDomain, getEmailValidationError, getDisplayNameFromEmail } from "@/lib/emailValidation";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const SAVED_EMAILS_KEY = "nae-saved-login-emails";
const MAX_SAVED_EMAILS = 10;

// Helper functions for managing saved emails
const getSavedEmails = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_EMAILS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveEmail = (email: string) => {
  try {
    const saved = getSavedEmails();
    // Remove if already exists (to avoid duplicates)
    const filtered = saved.filter(e => e.toLowerCase() !== email.toLowerCase());
    // Add to beginning of array
    const updated = [email, ...filtered].slice(0, MAX_SAVED_EMAILS);
    localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save email:', error);
  }
};

const removeSavedEmail = (email: string) => {
  try {
    const saved = getSavedEmails();
    const filtered = saved.filter(e => e.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove email:', error);
  }
};

export default function Landing() {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load saved emails on mount
  useEffect(() => {
    const saved = getSavedEmails();
    setSavedEmails(saved);
    // If there are saved emails, don't show manual input by default
    if (saved.length > 0) {
      setShowManualInput(false);
    } else {
      setShowManualInput(true);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handleSignIn = async () => {
    alert('Sign in button clicked!'); // Debug alert

    // Validate email
    const validationError = getEmailValidationError(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setIsLoading(true);
    setEmailError("");

    try {
      const displayName = getDisplayNameFromEmail(email);

      console.log('Starting login process...');
      console.log('Email:', email);
      console.log('Display name:', displayName);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies for session
        body: JSON.stringify({
          username: displayName,
          email: email,
        }),
      });

      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success) {
        console.log('Login successful, updating auth state...');

        // Save email to localStorage for future use
        saveEmail(email);

        toast({
          title: "Sign In Successful",
          description: `Welcome, ${displayName}!`,
        });

        // Invalidate auth queries to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        console.log('Navigating to dashboard...');
        // Use router navigation instead of window.location.href
        // Give a small delay to allow state to update
        setTimeout(() => {
          setLocation("/");
        }, 100);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">NAE IT Technology</h1>
          <p className="text-2xl text-muted-foreground mb-2">Test Sheet Management System</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Professional field operations documentation and export system
          </p>
        </header>

        {/* Login Card */}
        <Card className="max-w-md mx-auto mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In to Continue</CardTitle>
            <CardDescription>
              Access your test sheet dashboard and create professional documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved Emails Section */}
            {savedEmails.length > 0 && !showManualInput && (
              <div className="space-y-2">
                <Label htmlFor="saved-email" className="text-sm font-medium flex items-center">
                  <History className="h-4 w-4 mr-2" />
                  Select Previous Email
                </Label>
                <Select value={email} onValueChange={setEmail}>
                  <SelectTrigger id="saved-email" className="w-full">
                    <SelectValue placeholder="Choose from your previous logins" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedEmails.map((savedEmail) => (
                      <SelectItem key={savedEmail} value={savedEmail}>
                        <div className="flex items-center justify-between w-full">
                          <span>{savedEmail}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({getDisplayNameFromEmail(savedEmail)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualInput(true)}
                  className="w-full text-xs"
                >
                  Use a different email
                </Button>
              </div>
            )}

            {/* Manual Email Input */}
            {(showManualInput || savedEmails.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@NAE.co.za or your.email@gmail.com"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyPress={handleKeyPress}
                    className={`pl-10 ${emailError ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {savedEmails.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualInput(false)}
                    className="w-full text-xs"
                  >
                    <History className="h-3 w-3 mr-1" />
                    Choose from previous logins
                  </Button>
                )}
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
                {email && !emailError && isAllowedEmailDomain(email) && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <span className="font-medium">Welcome, {getDisplayNameFromEmail(email)}!</span>
                      <br />
                      <span className="text-xs">This name will be used for your profile</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-12"
              size="lg"
              onClick={handleSignIn}
              disabled={isLoading || !email}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                Restricted Access: Only <span className="font-mono font-semibold">@NAE.co.za</span> and <span className="font-mono font-semibold">@gmail.com</span> email addresses are accepted
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover-elevate">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Auto-Generated References</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically generate unique technology and admin reference numbers based on your profile
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Download className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Multiple Export Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export test sheets as professional PDF documents or Excel spreadsheets
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Comprehensive Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete test sheets with all required fields, status tracking, and detailed notes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-xs text-muted-foreground">
          <p>Powered by NAE IT Technology</p>
        </footer>
      </div>
    </div>
  );
}
