import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Heart,
  Share2,
  ShoppingCart,
  Eye,
  ThumbsUp,
  User,
  ArrowLeft,
  Zap,
} from 'lucide-react';

interface Design {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  likes_count: number;
  designer_id: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

interface RelatedDesign {
  id: string;
  title: string;
  price: number;
  image_url: string;
}

const DesignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, loading: wishlistLoading, toggleWishlist } = useWishlist(id || '');

  const [design, setDesign] = useState<Design | null>(null);
  const [relatedDesigns, setRelatedDesigns] = useState<RelatedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [purchaseCount, setPurchaseCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchDesign();
      fetchRelatedDesigns();
      fetchPurchaseCount();
    }
  }, [id]);

  const fetchDesign = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('designs')
      .select(`
        *,
        profiles:designer_id (
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching design:', error);
      toast({
        title: 'Error',
        description: 'Failed to load design',
        variant: 'destructive',
      });
      navigate('/');
    } else {
      setDesign(data as Design);
    }
    setLoading(false);
  };

  const fetchRelatedDesigns = async () => {
    const { data } = await supabase
      .from('designs')
      .select('id, title, price, image_url')
      .neq('id', id)
      .limit(4);

    if (data) {
      setRelatedDesigns(data);
    }
  };

  const fetchPurchaseCount = async () => {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('design_id', id)
      .eq('status', 'paid');

    setPurchaseCount(count || 0);
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to purchase this design',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!hasRole('buyer')) {
      toast({
        title: 'Buyer Role Required',
        description: 'Only buyers can purchase designs',
        variant: 'destructive',
      });
      return;
    }

    if (design?.designer_id === user.id) {
      toast({
        title: 'Cannot Purchase',
        description: "You can't purchase your own design",
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { design_id: id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to initiate checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Design link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!design) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Gallery
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative group"
          >
            <div
              className={`relative overflow-hidden rounded-lg border-2 border-border transition-all duration-300 ${
                imageZoom ? 'border-primary shadow-[0_0_30px_rgba(57,255,20,0.3)]' : ''
              }`}
              onMouseEnter={() => setImageZoom(true)}
              onMouseLeave={() => setImageZoom(false)}
            >
              <img
                src={design.image_url}
                alt={design.title}
                className={`w-full aspect-square object-cover transition-transform duration-500 ${
                  imageZoom ? 'scale-110' : 'scale-100'
                }`}
              />
              
              {/* Energy glow effect on hover */}
              {imageZoom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"
                />
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Designer Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                {design.profiles.avatar_url ? (
                  <img
                    src={design.profiles.avatar_url}
                    alt={design.profiles.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold text-foreground">{design.profiles.name}</p>
              </div>
            </div>

            {/* Title and Price */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{design.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {design.likes_count} likes
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  {purchaseCount} licensed
                </span>
              </div>
            </div>

            {/* Description */}
            {design.description && (
              <p className="text-muted-foreground leading-relaxed">{design.description}</p>
            )}

            {/* Price */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">License Price</p>
              <p className="text-5xl font-bold text-primary">${design.price}</p>
              <p className="text-xs text-muted-foreground mt-2">
                One-time payment for commercial use license
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handlePurchase}
                disabled={purchasing || design.designer_id === user?.id}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-energy-strong group"
              >
                {purchasing ? (
                  'Processing...'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Buy Now & License
                    <Zap className="w-4 h-4 ml-2 group-hover:animate-pulse" />
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary"
                >
                  <motion.div
                    animate={isInWishlist ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${
                        isInWishlist ? 'fill-primary text-primary' : ''
                      }`}
                    />
                  </motion.div>
                  {isInWishlist ? 'Saved' : 'Save'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20"
        >
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
              <TabsTrigger value="about">About Design</TabsTrigger>
              <TabsTrigger value="related">Related Designs</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-8">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Design Details</h3>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground mb-2">License Terms:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Commercial use allowed</li>
                        <li>Print on physical products</li>
                        <li>Use in marketing materials</li>
                        <li>No resale of the design itself</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-2">File Specifications:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>High-resolution digital file</li>
                        <li>Suitable for printing</li>
                        <li>Instant download after purchase</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedDesigns.map((related) => (
                  <motion.div
                    key={related.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/design/${related.id}`)}
                    className="cursor-pointer group"
                  >
                    <Card className="overflow-hidden bg-card/50 border-border hover:border-primary transition-colors">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={related.image_url}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-foreground truncate">{related.title}</h4>
                        <p className="text-primary font-bold">${related.price}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default DesignDetail;