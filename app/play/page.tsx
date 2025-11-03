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
  private platforms?: Phaser.GameObjects.Group;
  private coins?: Phaser.GameObjects.Group;
  private powerUps?: Phaser.GameObjects.Group;
  private playerBuffs: { speed: number; doubleJump: number; shield: number } = { speed: 0, doubleJump: 0, shield: 0 };
  private speedEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private shieldEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private jumpEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private score: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private playerCountText?: Phaser.GameObjects.Text;
  private lastPositionUpdate: number = 0;
  private collectSound?: Phaser.Sound.BaseSound;

  init(data: { charUrl?: string; roomId?: string; supabase?: any }) {
    this.charUrl = data.charUrl;
    this.roomId = data.roomId;
    this.supabase = data.supabase;
    this.otherPlayers = this.add.group();
    this.playerLabels = this.add.group();
    this.platforms = this.add.group();
    this.coins = this.add.group();
    this.powerUps = this.add.group();
  }

  create() {
    // Set world bounds for camera scrolling
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    
    const width = this.scale.width;
    const height = this.scale.height;

    // Load assets (SVGs in public/game-assets)
    this.load.image('asset-coin', '/game-assets/items/taleweave-coin.svg');
    this.load.image('asset-golden-coin', '/game-assets/items/taleweave-goldencoin.svg');
    this.load.image('asset-speed', '/game-assets/items/speed-boost.svg');
    this.load.image('asset-double-jump', '/game-assets/items/double-jump.svg');
    this.load.image('asset-shield', '/game-assets/items/shield.svg');

    // Particle texture
    const p = this.add.graphics();
    p.fillStyle(0xffffff, 1);
    p.fillCircle(2, 2, 2);
    p.generateTexture('spark', 4, 4);
    p.destroy();

    const pm = this.add.particles('spark');
    this.speedEmitter = pm.createEmitter({
      speed: { min: -50, max: 50 },
      lifespan: 400,
      quantity: 4,
      scale: { start: 0.6, end: 0 },
      tint: 0x4ecdc4,
      on: false,
    });
    this.shieldEmitter = pm.createEmitter({
      speed: 10,
      lifespan: 600,
      quantity: 3,
      scale: { start: 0.8, end: 0 },
      tint: 0x95e1d3,
      on: false,
    });
    this.jumpEmitter = pm.createEmitter({
      speed: { min: -80, max: 80 },
      lifespan: 500,
      quantity: 8,
      scale: { start: 0.8, end: 0 },
      tint: 0xffe66d,
      on: false,
    });

    // Create ground with visual style (full world width)
    const ground = this.add.rectangle(1000, 1950, 2000, 100, 0x4ECDC4);
    ground.setName('ground');
    this.physics.add.existing(ground, true);
    const groundBody = ground.body as Phaser.Physics.Arcade.Body;
    groundBody.setImmovable(true);
    
    // Add ground pattern/decorations
    for (let i = 0; i < 20; i++) {
      const grass = this.add.rectangle(100 + i * 100, 1920, 80, 30, 0x95E1D3);
      grass.setDepth(-1);
    }

    // Create more dynamic platforms with better spacing (spread across world)
    const platformConfigs = [
      { x: 300, y: 1800, width: 180, height: 25 },
      { x: 700, y: 1700, width: 180, height: 25 },
      { x: 1000, y: 1550, width: 220, height: 25 },
      { x: 150, y: 1450, width: 150, height: 25 },
      { x: 850, y: 1350, width: 150, height: 25 },
      { x: 500, y: 1250, width: 200, height: 25 },
      { x: 1200, y: 1150, width: 180, height: 25 },
      { x: 300, y: 1050, width: 180, height: 25 },
      { x: 1500, y: 950, width: 200, height: 25 },
      { x: 800, y: 850, width: 180, height: 25 },
    ];

    platformConfigs.forEach((plat, index) => {
      const platform = this.add.rectangle(plat.x, plat.y, plat.width, plat.height, 0xFF6B6B);
      platform.setName(`platform-${index}`);
      platform.setStrokeStyle(3, 0xFF4444);
      const body = this.physics.add.existing(platform, true);
      (body.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      this.platforms?.add(platform);

      // Add coins on some platforms
      if (index % 2 === 0) {
        this.createCoin(plat.x, plat.y - 40);
      }
      // Add extra coins on some platforms
      if (index % 3 === 0) {
        this.createCoin(plat.x - 30, plat.y - 40);
      }
    });

    // Add collectible coins scattered around the world
    for (let i = 0; i < 25; i++) {
      this.createCoin(
        Phaser.Math.Between(100, 1900),
        Phaser.Math.Between(500, 1800)
      );
    }

    // Add power-ups
    this.createPowerUp('speed-boost', 600, 1650, 'asset-speed');
    this.createPowerUp('double-jump', 1100, 1500, 'asset-double-jump');
    this.createPowerUp('shield', 1400, 1000, 'asset-shield');

    // Create UI elements
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#000',
      backgroundColor: '#fff',
      padding: { x: 10, y: 5 },
      fontFamily: 'Fredoka',
    });
    this.scoreText.setScrollFactor(0); // Fixed to camera

    this.playerCountText = this.add.text(20, 60, 'Players: 1', {
      fontSize: '18px',
      color: '#666',
      backgroundColor: '#fff',
      padding: { x: 10, y: 5 },
      fontFamily: 'Nunito',
    });
    this.playerCountText.setScrollFactor(0); // Fixed to camera

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
    // Create player sprite (use world coordinates)
    this.player = this.physics.add.sprite(1000, 1850, 'player-char');
    
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
    
    // Add visual feedback on jump
    this.player.setTint(0xFFFFFF);

    this.setupPlayerCollisions();
  }

  createDefaultPlayer() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create a colorful default character with better visuals
    const graphics = this.add.graphics();
    // Body (circle)
    graphics.fillStyle(0xFF6B6B, 1);
    graphics.fillCircle(0, 10, 25);
    // Head (circle)
    graphics.fillStyle(0xFFE66D, 1);
    graphics.fillCircle(0, -15, 18);
    // Eyes
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(-5, -18, 2);
    graphics.fillCircle(5, -18, 2);
    // Smile
    graphics.lineStyle(2, 0x000000);
    graphics.arc(0, -12, 8, 0, Math.PI);
    graphics.strokePath();
    graphics.generateTexture('default-char', 60, 60);
    graphics.destroy();

    this.player = this.physics.add.sprite(1000, 1850, 'default-char');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.player.setDragX(200);
    this.setupPlayerCollisions();
    
    // Center camera on player initially
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);
  }

  createCoin(x: number, y: number) {
    const coin = this.physics.add.sprite(x, y, 'asset-coin');
    
    coin.setScale(0.7);
    coin.setData('value', 1); // worth 1 coin
    
    // Add rotation animation
    this.tweens.add({
      targets: coin,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
    });

    this.coins?.add(coin);
    return coin;
  }

  createPowerUp(type: 'speed-boost' | 'double-jump' | 'shield', x: number, y: number, textureKey: string) {
    const item = this.physics.add.sprite(x, y, textureKey);
    item.setScale(0.8);
    item.setData('type', type);
    this.powerUps?.add(item);

    // Idle tween
    this.tweens.add({ targets: item, y: y - 10, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.easeInOut' });

    // Overlap to apply
    if (this.player) {
      this.physics.add.overlap(this.player, item, () => {
        this.applyPowerUp(type);
        item.destroy();
      });
    }
  }

  private applyPowerUp(type: string) {
    switch (type) {
      case 'speed-boost':
        this.playerBuffs.speed = 5000; // 5s
        if (this.player) this.speedEmitter?.startFollow(this.player);
        this.speedEmitter?.start();
        this.time.delayedCall(5000, () => {
          this.speedEmitter?.stop();
        });
        break;
      case 'double-jump':
        this.playerBuffs.doubleJump = Math.max(this.playerBuffs.doubleJump, 1);
        if (this.player) this.jumpEmitter?.explode(12, this.player.x, this.player.y);
        break;
      case 'shield':
        this.playerBuffs.shield = 10000; // 10s
        if (this.player) this.shieldEmitter?.startFollow(this.player);
        this.shieldEmitter?.start();
        this.time.delayedCall(10000, () => {
          this.shieldEmitter?.stop();
        });
        break;
    }
  }

  setupPlayerCollisions() {
    if (!this.player) return;

    // Collide with ground
    const ground = this.children.getByName('ground') as Phaser.GameObjects.Rectangle;
    if (ground) {
      this.physics.add.collider(this.player, ground);
    }

    // Collide with all platforms
    this.platforms?.children.entries.forEach((platform) => {
      this.physics.add.collider(this.player, platform as Phaser.GameObjects.Rectangle);
    });

    // Collect coins
    this.coins?.children.entries.forEach((coin) => {
      this.physics.add.overlap(
        this.player,
        coin as Phaser.GameObjects.Sprite,
        (player, coinSprite) => {
          this.collectCoin(coinSprite as Phaser.GameObjects.Sprite);
        }
      );
    });
  }

  setupInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Jump on spacebar or up arrow (supports double jump)
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      if (!this.player) return;
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-600);
        this.player.setTint(0x4ECDC4);
        this.time.delayedCall(100, () => { this.player?.clearTint(); });
        this.updatePlayerPosition();
      } else if (this.playerBuffs.doubleJump > 0) {
        this.player.setVelocityY(-600);
        this.playerBuffs.doubleJump -= 1;
        if (this.player) this.jumpEmitter?.explode(10, this.player.x, this.player.y);
        this.updatePlayerPosition();
      }
    });

    // WASD support
    const wKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const aKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const sKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const dKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    wKey?.on('down', () => {
      if (!this.player) return;
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-600);
        this.updatePlayerPosition();
      } else if (this.playerBuffs.doubleJump > 0) {
        this.player.setVelocityY(-600);
        this.playerBuffs.doubleJump -= 1;
        if (this.player) this.jumpEmitter?.explode(10, this.player.x, this.player.y);
        this.updatePlayerPosition();
      }
    });
  }

  collectCoin(coin: Phaser.GameObjects.Sprite) {
    const value = coin.getData('value') || 10;
    this.score += value;
    
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }

    // Particle effect
    const particles = this.add.particles(coin.x, coin.y, null, {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      tint: 0xFFE66D,
      lifespan: 500,
      quantity: 5,
    });

    this.time.delayedCall(500, () => {
      particles.destroy();
    });

    // Destroy coin
    coin.destroy();
    this.updatePlayerPosition();
    
    // Update score in database
    if (this.roomId && this.supabase) {
      this.updateGameState({ score: this.score });
    }
  }

  async updateGameState(stateUpdate: any) {
    if (!this.roomId || !this.supabase) return;

    try {
      const { data } = await this.supabase
        .from('game_rooms')
        .select('game_state')
        .eq('id', this.roomId)
        .single();

      const gameState = (data?.game_state || {}) as any;
      const updatedState = { ...gameState, ...stateUpdate };

      await this.supabase
        .from('game_rooms')
        .update({
          game_state: updatedState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.roomId);
    } catch (error) {
      console.error('Error updating game state:', error);
    }
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
    this.events.on('shutdown', async () => {
      try {
        await this.saveCoinsToProfile();
      } catch {}
      channel.unsubscribe();
    });
  }

  async updateOtherPlayers(players: any[]) {
    if (!this.supabase) return;

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Update player count
      const playerCount = players.length;
      if (this.playerCountText) {
        this.playerCountText.setText(`Players: ${playerCount}`);
      }

      // Track existing sprites to avoid recreating
      const existingSprites = new Map<string, any>();
      this.otherPlayers?.children.entries.forEach((sprite: any) => {
        const userId = sprite.getData('userId');
        if (userId) existingSprites.set(userId, sprite);
      });

      const existingLabels = new Map<string, any>();
      this.playerLabels?.children.entries.forEach((label: any) => {
        const userId = label.getData('userId');
        if (userId) existingLabels.set(userId, label);
      });

      // Remove players who left
      const currentPlayerIds = new Set(players.map((p: any) => p.user_id));
      existingSprites.forEach((sprite, userId) => {
        if (userId !== user.id && !currentPlayerIds.has(userId)) {
          sprite.destroy();
          existingSprites.delete(userId);
        }
      });
      existingLabels.forEach((label, userId) => {
        if (userId !== user.id && !currentPlayerIds.has(userId)) {
          label.destroy();
          existingLabels.delete(userId);
        }
      });

      // Create/update sprites for other players
      for (const playerData of players) {
        if (playerData.user_id === user.id) continue; // Skip self

        let sprite = existingSprites.get(playerData.user_id);

        if (!sprite) {
          // Create new sprite
          sprite = this.physics.add.sprite(playerData.x || 100, playerData.y || 100, null);
          
          // Try to load character image if available
          if (playerData.char_url) {
            this.load.image(`other-char-${playerData.user_id}`, playerData.char_url);
            this.load.once('complete', () => {
              sprite.setTexture(`other-char-${playerData.user_id}`);
              sprite.setScale(0.5);
            });
            this.load.start();
          } else {
            // Default colored character with better design
            const graphics = this.add.graphics();
            graphics.fillStyle(0x4ECDC4, 1);
            graphics.fillCircle(0, 10, 25);
            graphics.fillStyle(0xFFE66D, 1);
            graphics.fillCircle(0, -15, 18);
            graphics.generateTexture(`other-char-${playerData.user_id}`, 60, 60);
            graphics.destroy();
            sprite.setTexture(`other-char-${playerData.user_id}`);
            sprite.setScale(0.5);
          }

          sprite.setCollideWorldBounds(true);
          sprite.setData('userId', playerData.user_id);
          this.otherPlayers?.add(sprite);
          existingSprites.set(playerData.user_id, sprite);
        }

        // Smooth position interpolation
        if (sprite && (playerData.x !== undefined || playerData.y !== undefined)) {
          const targetX = playerData.x ?? sprite.x;
          const targetY = playerData.y ?? sprite.y;
          
          // Only tween if there's significant movement (reduces network lag issues)
          const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetX, targetY);
          if (distance > 5) {
            this.tweens.add({
              targets: sprite,
              x: targetX,
              y: targetY,
              duration: 150,
              ease: 'Power2',
            });
          }
        }

        // Update or create name label
        let label = existingLabels.get(playerData.user_id);

        if (!label) {
          label = this.add.text(playerData.x || 100, (playerData.y || 100) - 40, playerData.name || 'Player', {
            fontSize: '14px',
            color: '#000',
            backgroundColor: '#fff',
            padding: { x: 4, y: 2 },
            fontFamily: 'Fredoka',
          });
          label.setScrollFactor(0); // Follow player but stay visible
          label.setData('userId', playerData.user_id);
          this.playerLabels?.add(label);
          existingLabels.set(playerData.user_id, label);
        } else {
          // Update label position to follow sprite
          if (sprite) {
            label.setX(sprite.x - label.width / 2);
            label.setY(sprite.y - 40);
          }
        }
      }
    } catch (error) {
      console.error('Error updating other players:', error);
    }
  }

  async saveCoinsToProfile() {
    if (!this.supabase) return;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const { data } = await this.supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const prefs = (data?.preferences || {}) as any;
      const current = Number(prefs.total_coins || 0);
      const updated = current + this.score;

      await this.supabase
        .from('users')
        .update({ preferences: { ...prefs, total_coins: updated } })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving coins:', error);
    }
  }

  update() {
    if (!this.player || !this.cursors) return;

    // Horizontal movement with better feel (speed boost)
    if (this.cursors.left?.isDown) {
      const speed = this.playerBuffs.speed > 0 ? -450 : -300;
      this.player.setVelocityX(speed);
      this.player.setFlipX(true); // Face left
    } else if (this.cursors.right?.isDown) {
      const speed = this.playerBuffs.speed > 0 ? 450 : 300;
      this.player.setVelocityX(speed);
      this.player.setFlipX(false); // Face right
    } else {
      this.player.setVelocityX(0);
    }

    // Jump with double jump prevention
    if (this.cursors.up?.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-600);
    }

    // WASD movement support
    const aKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const dKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const wKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    if (aKey?.isDown) {
      this.player.setVelocityX(this.playerBuffs.speed > 0 ? -450 : -300);
      this.player.setFlipX(true);
    } else if (dKey?.isDown) {
      this.player.setVelocityX(this.playerBuffs.speed > 0 ? 450 : 300);
      this.player.setFlipX(false);
    }

    if (wKey?.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-600);
    }

    // Camera follow player (smooth)
    if (this.cameras.main) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.setDeadzone(100, 100);
    }

    // Buff timers (ms)
    // Decrement timers using delta
    // Handled in keyboard handlers too, but keep here for reliability
    // (Phaser passes delta in update signature, but we're not typing it here)

    // Throttled position update (every 150ms instead of every frame)
    const now = Date.now();
    if (now - this.lastPositionUpdate > 150) {
      this.updatePlayerPosition();
      this.lastPositionUpdate = now;
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
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg z-10">
        <p className="font-nunito text-sm">
          <strong>Controls:</strong> Arrow Keys/WASD to move, Space/Up/W to jump
        </p>
        <p className="font-nunito text-xs text-gray-600 mt-1">
          🪙 Collect coins • 🎯 Reach the top!
        </p>
        {roomId && (
          <p className="font-nunito text-xs text-gray-500 mt-1">Room: {roomId.slice(0, 20)}...</p>
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

