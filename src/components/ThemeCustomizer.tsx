
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { themeService, ThemeConfig } from '@/services/themeService';
import { Palette, Upload, RotateCcw } from 'lucide-react';

const ThemeCustomizer = () => {
  const [open, setOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(themeService.getTheme());
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    const updatedTheme = {
      ...currentTheme,
      colors: {
        ...currentTheme.colors,
        [colorKey]: value,
      },
    };
    setCurrentTheme(updatedTheme);
  };

  const handleBrandingChange = (brandingKey: keyof ThemeConfig['branding'], value: string) => {
    const updatedTheme = {
      ...currentTheme,
      branding: {
        ...currentTheme.branding,
        [brandingKey]: value,
      },
    };
    setCurrentTheme(updatedTheme);
  };

  const applyColorScheme = (colors: ThemeConfig['colors']) => {
    const updatedTheme = {
      ...currentTheme,
      colors,
    };
    setCurrentTheme(updatedTheme);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleBrandingChange('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveTheme = () => {
    themeService.saveTheme(currentTheme);
    toast({
      title: "Theme Updated",
      description: "Your theme has been saved successfully.",
    });
    setOpen(false);
  };

  const resetTheme = () => {
    themeService.resetToDefault();
    setCurrentTheme(themeService.getTheme());
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default.",
    });
  };

  const hslToHex = (hsl: string) => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    const hue = h / 360;
    const saturation = s / 100;
    const lightness = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    const r = Math.round(255 * hue2rgb(p, q, hue + 1/3));
    const g = Math.round(255 * hue2rgb(p, q, hue));
    const b = Math.round(255 * hue2rgb(p, q, hue - 1/3));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          Customize Theme
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Theme Customizer</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>Adjust the main colors of your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(currentTheme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-4">
                    <Label className="w-24 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      type="color"
                      value={hslToHex(value)}
                      onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], hexToHsl(e.target.value))}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)}
                      placeholder="HSL format"
                      className="flex-1 text-sm font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Branding</CardTitle>
                <CardDescription>Customize your site's logo and name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={currentTheme.branding.siteName}
                    onChange={(e) => handleBrandingChange('siteName', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Logo Upload</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {currentTheme.branding.logoUrl && (
                    <div className="mt-2">
                      <img 
                        src={currentTheme.branding.logoUrl} 
                        alt="Logo preview" 
                        className="max-w-32 max-h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={currentTheme.branding.favicon}
                    onChange={(e) => handleBrandingChange('favicon', e.target.value)}
                    placeholder="Enter favicon URL"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Presets</CardTitle>
                <CardDescription>Choose from predefined color schemes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {themeService.getColorSchemes().map((scheme) => (
                  <div key={scheme.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{scheme.name}</h4>
                      <div className="flex space-x-2 mt-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: `hsl(${scheme.colors.primary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: `hsl(${scheme.colors.secondary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: `hsl(${scheme.colors.accent})` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyColorScheme(scheme.colors)}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={resetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTheme}>
              Save Theme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeCustomizer;
