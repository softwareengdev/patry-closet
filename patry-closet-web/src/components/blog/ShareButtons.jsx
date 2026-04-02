import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Share2, Link2, Check } from 'lucide-react';
import { FaXTwitter, FaFacebook, FaPinterest, FaWhatsapp, FaLinkedin } from 'react-icons/fa6';
import { ThemeContext } from '../../context/ThemeContext';
import { useState } from 'react';

const ShareButtons = ({ title, url, description, image, variant = 'horizontal' }) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title || '');
  const encodedDesc = encodeURIComponent(description || '');

  const platforms = [
    {
      name: 'X',
      icon: FaXTwitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:text-gray-800 dark:hover:text-white',
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600',
    },
    {
      name: 'Pinterest',
      icon: FaPinterest,
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(image || '')}&description=${encodedTitle}`,
      color: 'hover:text-red-600',
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:text-green-500',
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:text-blue-500',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVertical = variant === 'vertical';

  return (
    <div
      className={`flex items-center gap-2 ${isVertical ? 'flex-col' : 'flex-row flex-wrap'}`}
      role="group"
      aria-label={t('blog.shareArticle', 'Share this article')}
    >
      {!isVertical && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">
          <Share2 className="w-3.5 h-3.5 inline mr-1" />
          {t('blog.share', 'Share')}
        </span>
      )}

      {platforms.map(p => {
        const Icon = p.icon;
        return (
          <motion.a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-full transition-colors text-gray-400 ${p.color}
              ${isDark ? 'hover:bg-gray-800' : 'hover:bg-warm-300'}`}
            title={`${t('blog.shareOn', 'Share on')} ${p.name}`}
            aria-label={`${t('blog.shareOn', 'Share on')} ${p.name}`}
          >
            <Icon className="w-4 h-4" />
          </motion.a>
        );
      })}

      {/* Copy link button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopyLink}
        className={`p-2 rounded-full transition-colors
          ${copied
            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            : `text-gray-400 ${isDark ? 'hover:bg-gray-800 hover:text-gray-300' : 'hover:bg-warm-300 hover:text-gray-600'}`
          }`}
        title={copied ? t('blog.linkCopied', 'Link copied!') : t('blog.copyLink', 'Copy link')}
        aria-label={t('blog.copyLink', 'Copy link')}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </motion.button>
    </div>
  );
};

export default ShareButtons;
