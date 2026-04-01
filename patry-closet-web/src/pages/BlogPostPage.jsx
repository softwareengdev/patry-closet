import { useContext, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ChevronUp,
  BookOpen,
  Tag,
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useBlogPost, useRelatedPosts } from '../hooks/useBlog';
import TableOfContents from '../components/blog/TableOfContents';
import ShareButtons from '../components/blog/ShareButtons';
import RelatedPosts from '../components/blog/RelatedPosts';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);

  const { data: post, isLoading, error } = useBlogPost(slug);
  const { data: relatedPosts } = useRelatedPosts(post?.id);

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const contentRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // GA4 analytics
  useEffect(() => {
    if (post && typeof window.gtag === 'function') {
      window.gtag('event', 'blog_read', {
        article_id: post.id,
        article_title: post.titleFallback,
        article_category: post.category,
        reading_time: post.readingTime,
      });
    }
  }, [post]);

  if (isLoading) return <PostSkeleton isDark={isDark} />;

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center px-6">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {t('blog.postNotFound', 'Article not found')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('blog.postNotFoundHint', 'The article you\'re looking for doesn\'t exist or has been moved.')}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('blog.backToBlog', 'Back to Blog')}
          </Link>
        </div>
      </div>
    );
  }

  const publishDate = new Date(post.publishedAt).toLocaleDateString(
    t('locale', 'en-US'),
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const categoryLabel = t(
    `blog.categories.${post.category === 'style-guides' ? 'styleGuides' : post.category === 'behind-the-brand' ? 'behindBrand' : post.category}`,
    post.category
  );

  const articleTitle = t(post.titleKey, post.titleFallback);
  const articleDescription = t(post.excerptKey, post.excerptFallback);
  const articleUrl = `https://patrycloset.com/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleTitle,
    description: articleDescription,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Patry Closet',
      url: 'https://patrycloset.com',
      logo: { '@type': 'ImageObject', url: 'https://patrycloset.com/icons/icon-512x512.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    wordCount: post.content?.split(/\s+/).length || 0,
    articleSection: categoryLabel,
    keywords: post.tags?.join(', '),
  };

  return (
    <article className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* ─── SEO META + JSON-LD ─── */}
      <Helmet>
        <title>{articleTitle} — Patry Closet</title>
        <meta name="description" content={articleDescription} />
        <link rel="canonical" href={articleUrl} />
        <meta property="og:title" content={articleTitle} />
        <meta property="og:description" content={articleDescription} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.updatedAt || post.publishedAt} />
        <meta property="article:author" content={post.author.name} />
        <meta property="article:section" content={categoryLabel} />
        {post.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={articleTitle} />
        <meta name="twitter:description" content={articleDescription} />
        <meta name="twitter:image" content={post.coverImage} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ─── HERO ─── */}
      <header ref={heroRef} className="relative overflow-hidden">
        {/* Cover image */}
        <div className="relative h-[50vh] sm:h-[60vh] lg:h-[65vh]">
          <img
            src={post.coverImage}
            alt={post.coverImageAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        </div>

        {/* Hero content overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Breadcrumb + Category */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t('blog.backToBlog', 'Blog')}
                </Link>
                <span className="text-gray-500">·</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  {categoryLabel}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-serif font-light text-white leading-tight mb-5">
                {t(post.titleKey, post.titleFallback)}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{post.author.name}</p>
                    <p className="text-[11px] text-gray-400">{post.author.role}</p>
                  </div>
                </div>

                <span className="text-gray-600">|</span>

                {/* Date */}
                <span className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishDate}
                </span>

                {/* Reading time */}
                <span className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readingTime} {t('blog.minRead', 'min read')}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ─── ARTICLE BODY ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex gap-10">
          {/* Main content */}
          <div ref={contentRef} className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            {/* Share bar (top) */}
            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
              <ShareButtons
                title={t(post.titleKey, post.titleFallback)}
                description={t(post.excerptKey, post.excerptFallback)}
                image={post.coverImage}
              />
            </div>

            {/* Markdown content */}
            <div className={`prose prose-lg max-w-none
              ${isDark
                ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-strong:text-white prose-blockquote:border-amber-500/40 prose-blockquote:text-gray-400 prose-code:text-amber-300 prose-th:text-gray-300'
                : 'prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-blockquote:border-amber-300 prose-blockquote:text-gray-500'
              }
              prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
              prose-table:text-sm
              prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2
              prose-li:marker:text-amber-500
            `}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      loading="lazy"
                      className="w-full rounded-xl shadow-lg"
                    />
                  ),
                  a: ({ node, children, href, ...props }) => {
                    if (href?.startsWith('/')) {
                      return <Link to={href} {...props}>{children}</Link>;
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    );
                  },
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
                      <table {...props} className="w-full" />
                    </div>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {post.tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${tag}`}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all
                        ${isDark
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-amber-400'
                          : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share bar (bottom) */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <ShareButtons
                title={t(post.titleKey, post.titleFallback)}
                description={t(post.excerptKey, post.excerptFallback)}
                image={post.coverImage}
              />
            </div>

            {/* Author bio */}
            <div className={`mt-10 p-6 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/20 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{post.author.name}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{post.author.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('blog.authorBio', 'Part of the Patry Closet editorial team, dedicated to bringing you the best in fashion, sustainability, and style.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Related posts */}
            {relatedPosts && <RelatedPosts posts={relatedPosts} />}

            {/* CTA - Shop collection */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`mt-14 p-8 sm:p-10 rounded-2xl text-center ${
                isDark
                  ? 'bg-gradient-to-br from-amber-900/20 to-gray-900 border border-amber-800/20'
                  : 'bg-gradient-to-br from-amber-50 to-white border border-amber-100'
              }`}
            >
              <h3 className="text-xl sm:text-2xl font-serif font-medium text-gray-900 dark:text-white mb-2">
                {t('blog.ctaTitle', 'Explore the Collection')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-md mx-auto">
                {t('blog.ctaSubtitle', 'Discover the pieces that inspired this article and build your perfect wardrobe.')}
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {t('blog.shopNow', 'Shop Now')}
              </Link>
            </motion.div>
          </div>

          {/* ─── Sticky TOC (desktop) ─── */}
          <div className="hidden xl:block w-64 flex-shrink-0">
            <TableOfContents content={post.content} />
          </div>
        </div>
      </div>

      {/* ─── Scroll to top ─── */}
      <ScrollToTop isDark={isDark} />
    </article>
  );
};

// ─── SCROLL TO TOP ───
const ScrollToTop = ({ isDark }) => {
  const handleClick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0 }}
      className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-40 transition-colors
        ${isDark
          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </motion.button>
  );
};

// ─── SKELETON ───
const PostSkeleton = ({ isDark }) => (
  <div className="min-h-screen bg-white dark:bg-gray-950">
    <div className="h-[50vh] bg-gray-200 dark:bg-gray-800 animate-pulse" />
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
          style={{ width: `${60 + Math.random() * 40}%` }} />
      ))}
    </div>
  </div>
);

export default BlogPostPage;
