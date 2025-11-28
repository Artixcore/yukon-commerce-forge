import { supabase } from "@/integrations/supabase/client";

interface MetaEventData {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}

interface MetaUserData {
  ph?: string;
  em?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  country?: string;
}

export const trackMetaEvent = async (
  eventName: string,
  eventData: MetaEventData = {},
  userData: MetaUserData = {}
) => {
  try {
    const payload = {
      event_name: eventName,
      custom_data: {
        ...eventData,
      },
      user_data: {
        ...userData,
        client_user_agent: navigator.userAgent,
      },
      event_source_url: window.location.href,
      action_source: 'website',
    };

    const { error } = await supabase.functions.invoke('meta-conversion', {
      body: payload,
    });

    if (error) {
      console.error('Meta tracking error:', error);
    }
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Meta tracking error:', error);
  }
};
