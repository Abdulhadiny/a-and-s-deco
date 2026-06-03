import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, Building2, BadgePercent, Coins, Globe } from "lucide-react";
import { updateSystemConfig } from "@/lib/actions/config";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  const configs = await db.systemConfig.findMany();
  
  const getConfig = (key: string, defaultValue: any) => {
    const config = configs.find(c => c.key === key);
    return config ? config.value : defaultValue;
  };

  async function handleSave(formData: FormData) {
    "use server";
    
    const updates = [
      { key: "company_name", value: formData.get("company_name") },
      { key: "company_address", value: formData.get("company_address") },
      { key: "tax_rate", value: Number(formData.get("tax_rate")) },
      { key: "currency", value: formData.get("currency") },
      { key: "currency_symbol", value: formData.get("currency_symbol") },
    ];

    for (const update of updates) {
      if (update.value !== null) {
        await updateSystemConfig(update.key, update.value);
      }
    }

    revalidatePath("/settings/configuration");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Configuration"
        description="Global business settings and financial defaults"
      />

      <form action={handleSave} className="space-y-6">
        {/* Business Info */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <CardTitle className="text-foreground">Business Information</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Details used for invoices and quotes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-foreground/80">Company Name</Label>
              <Input 
                id="company_name" 
                name="company_name"
                defaultValue={getConfig("company_name", "A&S Decorations")} 
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_address" className="text-foreground/80">Business Address</Label>
              <Input 
                id="company_address" 
                name="company_address"
                defaultValue={getConfig("company_address", "")} 
                className="bg-muted border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <BadgePercent className="h-5 w-5" />
              <CardTitle className="text-foreground">Financial Settings</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Tax rates and default pricing rules
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tax_rate" className="text-foreground/80">Default VAT Rate (%)</Label>
              <Input 
                id="tax_rate" 
                name="tax_rate"
                type="number" 
                step="0.01"
                defaultValue={getConfig("tax_rate", 7.5)} 
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-foreground/80">System Currency</Label>
              <Input 
                id="currency" 
                name="currency"
                defaultValue={getConfig("currency", "NGN")} 
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_symbol" className="text-foreground/80">Currency Symbol</Label>
              <Input 
                id="currency_symbol" 
                name="currency_symbol"
                defaultValue={getConfig("currency_symbol", "₦")} 
                className="bg-muted border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="px-8 font-bold">
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
