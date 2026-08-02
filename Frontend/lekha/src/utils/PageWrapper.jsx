//Wrapper component for all pages to add page transition animations using framer-motion.
import { motion } from "framer-motion";

export default function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
