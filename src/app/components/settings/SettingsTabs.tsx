/**
 * Settings sidebar: the legacy bootstrap accordion panels "Page", "Default"
 * and "File" (generator/index.html) hosted as shadcn Tabs.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefaultsSettings } from './DefaultsSettings';
import { FileSettings } from './FileSettings';
import { PageSettings } from './PageSettings';

export function SettingsTabs() {
  return (
    <Tabs defaultValue="page" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="page">Page</TabsTrigger>
        <TabsTrigger value="defaults">Default</TabsTrigger>
        <TabsTrigger value="file">File</TabsTrigger>
      </TabsList>
      <TabsContent value="page">
        <PageSettings />
      </TabsContent>
      <TabsContent value="defaults">
        <DefaultsSettings />
      </TabsContent>
      <TabsContent value="file">
        <FileSettings />
      </TabsContent>
    </Tabs>
  );
}
