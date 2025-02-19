'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusOrder = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];

export function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const validStatus = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="relative h-2 bg-gray-200 rounded-full w-full max-w-2xl my-8">
      {statusOrder.map((status, index) => (
        <div 
          key={status} 
          className="absolute -top-3.5" 
          style={{ left: `${(index * 100) / (statusOrder.length - 1)}%` }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center border-2',
              index <= validStatus 
                ? 'bg-primary border-primary' 
                : 'bg-background border-gray-300'
            )}
          >
            {index < validStatus && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-medium capitalize whitespace-nowrap"
          >
            {status.toLowerCase().replace('_', ' ')}
          </motion.div>
        </div>
      ))}
      
      <motion.div
        className="absolute h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(validStatus * 100) / (statusOrder.length - 1)}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}