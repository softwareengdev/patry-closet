import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { List, ChevronRight } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const TableOfContents = ({ content }) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract headings from markdown content
  useEffect(() => {
    if (!content) return;
    const regex = /^#{2,3}\s+(.+)$/gm;
    const extracted = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].replace(/[*_`\[\]]/g, '').trim();
      const level = match[0].startsWith('###') ? 3 : 2;
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      extracted.push({ id, text, level });
    }
    setHeadings(extracted);
  }, [content]);

  // Observe heading elements for active state
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`sticky top-24 rounded-xl border p-4 ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'
      }`}
      aria-label={t('blog.tableOfContents', 'Table of contents')}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full text-left mb-3"
        aria-expanded={!isCollapsed}
      >
        <List className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
          {t('blog.tableOfContents', 'Contents')}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 ml-auto text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
        />
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-0.5 overflow-hidden"
          >
            {headings.map(h => (
              <li key={h.id}>
                <button
                  onClick={() => handleClick(h.id)}
                  className={`block w-full text-left text-xs py-1.5 px-2 rounded-md transition-all leading-snug
                    ${h.level === 3 ? 'pl-5' : ''}
                    ${activeId === h.id
                      ? isDark
                        ? 'text-amber-400 bg-amber-500/10 font-medium'
                        : 'text-amber-700 bg-amber-50 font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default TableOfContents;
