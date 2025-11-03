'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Phaser from 'phaser';
import { useRouter } from 'next/navigation';

// Jumper Game Scene
class JumperScene extends Phaser.Scene {
  private charUrl?: string;
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private roomId?: string;
  private supabase?: any;
  private otherPlayers?: Phaser.GameObjects.Group;
  private playerLabels?: Phaser.GameObjects.Group;

  init(data: { charUrl?: string; roomId?: string; supabase?: any }) {
    this.charUrl = data.charUrl;
    this.roomId = data.roomId;
    this.supabase = data.supabase;
    this.otherPlayers = this.add.group();
    this.playerLabels = this.add.group();
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create ground
    const ground = this.add.rectangle(width / 2, height - 50, width, 100, 0x4ECDC4);
    this.physics.add.existing(ground, true);

    // Create platforms
    const platforms = [
      { x: 200, y: height - 200, width: 150 },
      { x: width - 200, y: height - 300, width: 150 },
      { x: width / 2, y: height - 400, width: 200 },
    ];

    platforms.forEach((plat) => {
      const platform = this.add.rectangle(plat.x, plat.y, plat.width, 20, 0xFF6B6B);
      const body = this.physics.add.existing(platform, true);
      (body.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    });

    // Load player character
    if (this.charUrl) {
      this.load.image('player-char', this.charUrl);
      this.load.once('complete', () => {
        this.createPlayer();
        this.setupInput();
        this.subscribeToRoom();
      });
      this.load.start();
    } else {
      // Default character if none found
      this.createDefaultPlayer();
      this.setupInput();
    }
  }

  createPlayer() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create player sprite (circular for now, replace with character image)
    this.player = this.physics.add.sprite(width / 2, height - 150, 'player-char');
    
    // If image didn't load, create a default sprite
    if (!this.player.texture.key || this.player.texture.key === '__MISSING') {
      this.player.destroy();
      this.createDefaultPlayer();
      return;
    }

    // Scale character
    this.player.setScale(0.5);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.player.setDragX(200);

    // Collisions with ground and platforms
    const ground = this.children.getByName('ground') as Phaser.GameObjects.Rectangle;
    if (ground) {
      this.physics.add.collider(this.player, ground);
    }

    // Collide with platforms
    this.children.list.forEach((child) => {
      if (child.name?.startsWith('platform-')) {
        this.physics.add.collider(this.player, child as Phaser.GameObjects.Rectangle);
      }
    });
  }

  createDefaultPlayer() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create a colorful default character
    this.player = this.physics.add.sprite(width / 2, height - 150, null);
    
    // Draw a simple character shape
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF6B6B, 1);
    graphics.fillCircle(0, 0, 30);
    graphics.generateTexture('default-char', 60, 60);
    graphics.destroy();

    this.load.image('default-char-sprite', 'default-char');
    this.load.once('complete', () => {
      this.player?.destroy();
      this.player = this.physics.add.sprite(width / 2, height - 150, 'default-char-sprite');
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.2);
      this.player.setDragX(200);
    });
    this.load.start();
  }

  setupInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Jump on spacebar or up arrow
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      if (this.player?.body.touching.down) {
        this.player.setVelocityY(-600);
        this.updatePlayerPosition();
      }
    });
  }

  async updatePlayerPosition() {
    if (!this.player || !this.roomId || !this.supabase) return;

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Update player position in room
      const { data } = await this.supabase
        .from('game_rooms')
        .select('players')
        .eq('id', this.roomId)
        .single();

      if (!data) return;

      const players = (data.players || []) as any[];
      const playerIndex = players.findIndex((p: any) => p.user_id === user.id);

      const playerData = {
        user_id: user.id,
        x: this.player.x,
        y: this.player.y,
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y,
        char_url: this.charUrl || '',
        name: user.user_metadata?.display_name || 'Player',
      };

      if (playerIndex >= 0) {
        players[playerIndex] = playerData;
      } else {
        players.push(playerData);
      }

      await this.supabase
        .from('game_rooms')
        .update({
          players,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.roomId);
    } catch (error) {
      console.error('Error updating player position:', error);
    }
  }

  subscribeToRoom() {
    if (!this.roomId || !this.supabase) return;

    // Subscribe to room changes
    const channel = this.supabase
      .channel(`room:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${this.roomId}`,
        },
        (payload: any) => {
          this.updateOtherPlayers(payload.new.players);
        }
      )
      .subscribe();

    // Cleanup on scene destroy
    this.events.on('shutdown', () => {
      channel.unsubscribe();
    });
  }

  async updateOtherPlayers(players: any[]) {
    if (!this.supabase) return;

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Clear existing other players
      this.otherPlayers?.clear(true, true);
      this.playerLabels?.clear(true, true);

      // Create sprites for other players
      for (const playerData of players) {
        if (playerData.user_id === user.id) continue; // Skip self

        // Find or create sprite for this player
        let sprite = this.otherPlayers?.children.entries.find(
          (child: any) => child.getData('userId') === playerData.user_id
        ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;

        if (!sprite) {
          // Create new sprite
          sprite = this.physics.add.sprite(playerData.x || 100, playerData.y || 100, null);
          
          // Create simple colored circle sprite
          const graphics = this.add.graphics();
          graphics.fillStyle(0x4ECDC4, 1);
          graphics.fillCircle(0, 0, 30);
          graphics.generateTexture(`other-char-${playerData.user_id}`, 60, 60);
          graphics.destroy();

          sprite.setTexture(`other-char-${playerData.user_id}`);
          sprite.setScale(0.5);
          sprite.setData('userId', playerData.user_id);
          this.otherPlayers?.add(sprite);
        }

        // Update position smoothly
        if (sprite) {
          this.tweens.add({
            targets: sprite,
            x: playerData.x || sprite.x,
            y: playerData.y || sprite.y,
            duration: 100,
            ease: 'Power2',
          });
        }

        // Update or create name label
        let label = this.playerLabels?.children.entries.find(
          (child: any) => child.getData('userId') === playerData.user_id
        ) as Phaser.GameObjects.Text | undefined;

        if (!label) {
          label = this.add.text(playerData.x || 100, (playerData.y || 100) - 40, playerData.name || 'Player', {
            fontSize: '14px',
            color: '#000',
            backgroundColor: '#fff',
            padding: { x: 4, y: 2 },
          });
          label.setData('userId', playerData.user_id);
          this.playerLabels?.add(label);
        } else {
          label.setX((playerData.x || label.x) - 20);
          label.setY((playerData.y || label.y) - 40);
        }
      }
    } catch (error) {
      console.error('Error updating other players:', error);
    }
  }

  update() {
    if (!this.player || !this.cursors) return;

    // Horizontal movement
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (this.cursors.up?.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-600);
    }

    // Update position periodically (throttled)
    if (!this.time.delayedCall) {
      this.time.delayedCall(100, () => {
        this.updatePlayerPosition();
      });
    }
  }
}

export default function PlayPage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function initGame() {
      try {
        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login?redirect=/play');
          return;
        }

        // Load user's character
        const { data: character } = await supabase
          .from('characters')
          .select('image_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const charUrl = character?.image_url || null;

        // Create or join game room
        const gameType = 'jumper';
        const { data: existingRoom } = await supabase
          .from('game_rooms')
          .select('id')
          .eq('game_type', gameType)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        let currentRoomId: string;

        if (existingRoom) {
          currentRoomId = existingRoom.id;
        } else {
          // Create new room
          currentRoomId = `${gameType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await supabase
            .from('game_rooms')
            .insert({
              id: currentRoomId,
              game_type: gameType,
              players: [],
              is_active: true,
            });
        }

        setRoomId(currentRoomId);

        // Initialize Phaser game
        if (canvasRef.current) {
          const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: canvasRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#95E1D3', // Mint color
            physics: {
              default: 'arcade',
              arcade: {
                gravity: { y: 1200 },
                debug: false,
              },
            },
            scene: JumperScene,
            scale: {
              mode: Phaser.Scale.RESIZE,
              autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            callbacks: {
              preBoot: () => ({
                charUrl,
                roomId: currentRoomId,
                supabase,
              }),
            },
          };

          gameRef.current = new Phaser.Game(config);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing game:', err);
        setError(err.message || 'Failed to load game');
        setLoading(false);
      }
    }

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center z-50">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral mb-4">Loading Game...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center z-50">
        <div className="card max-w-md text-center">
          <h1 className="font-fredoka text-3xl text-red-600 mb-4">Error</h1>
          <p className="font-nunito text-lg mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div ref={canvasRef} id="game-container" className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
        <p className="font-nunito text-sm">
          <strong>Controls:</strong> Arrow keys to move, Space/Up to jump
        </p>
        {roomId && (
          <p className="font-nunito text-xs text-gray-600 mt-1">Room: {roomId}</p>
        )}
      </div>
      <button
        onClick={() => {
          if (gameRef.current) {
            gameRef.current.destroy(true);
          }
          router.push('/');
        }}
        className="absolute top-4 right-4 btn-secondary z-10"
      >
        Exit Game
      </button>
    </div>
  );
}

