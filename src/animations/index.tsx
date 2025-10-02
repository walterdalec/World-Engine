import { motion, Variants } from 'framer-motion';

/**
 * Animation presets for World Engine UI
 * Provides smooth, consistent animations across the app
 */

// Page transition animations
export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        x: -20
    },
    in: {
        opacity: 1,
        x: 0
    },
    out: {
        opacity: 0,
        x: 20
    }
};

export const pageTransition = {
    type: 'tween' as const,
    ease: [0.25, 0.46, 0.45, 0.94] as const,
    duration: 0.4
};

// Character creation step animations
export const stepVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: {
            duration: 0.2,
            ease: 'easeIn'
        }
    }
};

// Portrait loading animations
export const portraitVariants: Variants = {
    loading: {
        opacity: 0.5,
        scale: 0.95,
        filter: 'blur(2px)'
    },
    loaded: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    },
    error: {
        opacity: 0.7,
        scale: 0.9,
        filter: 'grayscale(100%)',
        transition: {
            duration: 0.2
        }
    }
};

// Stat changes animation
export const statVariants: Variants = {
    increased: {
        color: '#10B981', // green
        scale: 1.1,
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    },
    decreased: {
        color: '#EF4444', // red
        scale: 0.9,
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    },
    normal: {
        color: '#374151', // gray
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    }
};

// Button hover animations
export const buttonVariants: Variants = {
    hover: {
        scale: 1.05,
        transition: {
            duration: 0.2,
            ease: 'easeInOut'
        }
    },
    tap: {
        scale: 0.95,
        transition: {
            duration: 0.1,
            ease: 'easeInOut'
        }
    }
};

// Map-related animations (for future procedural maps)
export const mapVariants: Variants = {
    generating: {
        opacity: 0.8,
        scale: 0.98,
        filter: 'blur(1px)',
        transition: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse'
        }
    },
    generated: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: 'easeOut'
        }
    }
};

// Stagger animations for lists
export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    }
};

/**
 * Animated wrapper components
 */

// Page wrapper with smooth transitions
export const AnimatedPage: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
    >
        {children}
    </motion.div>
);

// Character creation step wrapper
export const AnimatedStep: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={stepVariants}
        className={className}
    >
        {children}
    </motion.div>
);

// Portrait with loading states
export const AnimatedPortrait: React.FC<{
    children: React.ReactNode;
    isLoading?: boolean;
    hasError?: boolean;
    className?: string;
}> = ({ children, isLoading = false, hasError = false, className = '' }) => {
    const variant = hasError ? 'error' : isLoading ? 'loading' : 'loaded';

    return (
        <motion.div
            animate={variant}
            variants={portraitVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Animated button
export const AnimatedButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, disabled = false, className = '', type = 'button' }) => (
    <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        variants={buttonVariants}
        whileHover={disabled ? undefined : 'hover'}
        whileTap={disabled ? undefined : 'tap'}
        className={className}
    >
        {children}
    </motion.button>
);

// Animated stat display
export const AnimatedStat: React.FC<{
    value: number;
    previousValue?: number;
    label: string;
    className?: string;
}> = ({ value, previousValue, label, className = '' }) => {
    const variant = previousValue !== undefined
        ? value > previousValue ? 'increased'
            : value < previousValue ? 'decreased'
                : 'normal'
        : 'normal';

    return (
        <motion.div
            animate={variant}
            variants={statVariants}
            className={className}
        >
            <span className="font-bold">{value}</span>
            <span className="ml-1 text-sm opacity-75">{label}</span>
        </motion.div>
    );
};

export default {
    pageVariants,
    pageTransition,
    stepVariants,
    portraitVariants,
    statVariants,
    buttonVariants,
    mapVariants,
    containerVariants,
    itemVariants,
    AnimatedPage,
    AnimatedStep,
    AnimatedPortrait,
    AnimatedButton,
    AnimatedStat
};