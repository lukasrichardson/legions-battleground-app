import Router from "next/router";
import { useEffect } from "react";
declare global {
 interface Window {
  adsbygoogle: unknown[];
 }
}

interface AdsBannerProps {
 "data-ad-slot": string;
 "data-ad-format": string;
 "data-full-width-responsive": string;
 "data-ad-layout"?: string;
}

const AdBanner = (props: AdsBannerProps) => {
 useEffect(() => {
  let currentIntervalId: NodeJS.Timeout | null = null;
  
  const handleRouteChange = () => {
   // Clear any existing interval before creating a new one
   if (currentIntervalId) {
    clearInterval(currentIntervalId);
   }
   
   currentIntervalId = setInterval(() => {
    try {
     // Check if the 'ins' element already has an ad in it
     if (window.adsbygoogle) {
      window.adsbygoogle.push({});
      if (currentIntervalId) {
       clearInterval(currentIntervalId);
       currentIntervalId = null;
      }
     }
    } catch (err) {
     console.error("Error pushing ads: ", err);
     if (currentIntervalId) {
      clearInterval(currentIntervalId);
      currentIntervalId = null;
     }
    }
   }, 100);
  };

  // Run the function when the component mounts
  handleRouteChange();

  // Subscribe to route changes
  if (typeof window !== "undefined") {
   Router.events.on("routeChangeComplete", handleRouteChange);

   // Unsubscribe from route changes when the component unmounts
   return () => {
    // Clean up interval and event listener
    if (currentIntervalId) {
     clearInterval(currentIntervalId);
    }
    Router.events.off("routeChangeComplete", handleRouteChange);
   };
  }
  
  // Cleanup function for when there's no window
  return () => {
   if (currentIntervalId) {
    clearInterval(currentIntervalId);
   }
  };
 }, []);

 return (
  <ins
   className="adsbygoogle adbanner-customize mt-2"
   style={{
    display: "block",
    overflow: "hidden",
    border: process.env.NODE_ENV === "development" ? "1px solid red" : "none",
   }}
   data-adtest="on"
   data-ad-client={"ca-pub-xxxxxxxxxxxxxxxx"}
   {...props}
  />
 );
};
export default AdBanner;