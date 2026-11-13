"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/** next/link as a framer-motion element (keeps client navigation/prefetch). Server components may pass serialisable motion props. */
export const MotionLink = motion.create(Link);
