'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import * as Phaser from 'phaser';

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
  private jumpTouchZone?: Phaser.GameObjects.Zone;

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

  preload() {
    this.load.image('asset-coin', '/game-assets/items/taleweave-coin.svg');
    this.load.image('asset-golden-coin', '/game-assets/items/taleweave-goldencoin.svg');
    this.load.image('asset-speed', '/game-assets/items/speed-boost.svg');
    this.load.image('asset-double-jump', '/game-assets/items/double-jump.svg');
    this.load.image('asset-shield', '/game-assets/items/shield.svg');
    this.load.audio('collect', '/game-assets/sfx/collect.mp3');
  }

  create() {
    if (typeof window === 'undefined') return;
    
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    
    const width = this.scale.width;
    const height = this.scale.height;

    if (!this.textures.exists('spark')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(2, 2, 2);
      gfx.generateTexture('spark', 4, 4);
      gfx.destroy();
    }

    this.speedEmitter = this.add.particles(0, 0, 'spark', {
      speed: { min: -50, max: 50 },
      lifespan: 400,
      quantity: 4,
      scale: { start: 0.6, end: 0 },
      tint: 0x4ecdc4,
    }) as Phaser.GameObjects.Particles.ParticleEmitter;
    this.speedEmitter.stop();
    
    this.shieldEmitter = this.add.particles(0, 0, 'spark', {
      speed: 10,
      lifespan: 600,
      quantity: 3,
      scale: { start: 0.8, end: 0 },
      tint: 0x95e1d3,
    }) as Phaser.GameObjects.Particles.ParticleEmitter;
    this.shieldEmitter.stop();
    
    this.jumpEmitter = this.add.particles(0, 0, 'spark', {
      speed: { min: -80, max: 80 },
      lifespan: 500,
      quantity: 8,
      scale: { start: 0.8, end: 0 },
      tint: 0xffe66d,
    }) as Phaser.GameObjects.Particles.ParticleEmitter;
    this.jumpEmitter.stop();

    const ground = this.add.rectangle(1000, 1950, 2000, 100, 0x4ECDC4);
    ground.setName('ground');
    this.physics.add.existing(ground, true);
    (ground.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    
    for (let i = 0; i < 20; i++) {
      const grass = this.add.rectangle(100 + i * 100, 1920, 80, 30, 0x95E1D3);
      grass.setDepth(-1);
    }

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

      if (index % 2 === 0) {
        this.createCoin(plat.x, plat.y - 40);
      }
      if (index % 3 === 0) {
        this.createCoin(plat.x - 30, plat.y - 40);
      }
    });

    for (let i = 0; i < 25; i++) {
      this.createCoin(
        Phaser.Math.Between(100, 1900),
        Phaser.Math.Between(500, 1800)
      );
    }

    this.createPowerUp('speed-boost', 600, 1650, 'asset-speed');
    this.createPowerUp('double-jump', 1100, 1500, 'asset-double-jump');
    this.createPowerUp('shield', 1400, 1000, 'asset-shield');

    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#000',
      backgroundColor: '#fff',
      padding: { x: 10, y: 5 },
      fontFamily: 'Fredoka',
    });
    this.scoreText.setScrollFactor(0);

    this.playerCountText = this.add.text(20, 60, 'Players: 1', {
      fontSize: '18px',
      color: '#666',
      backgroundColor: '#fff',
      padding: { x: 10, y: 5 },
      fontFamily: 'Nunito',
    });
    this.playerCountText.setScrollFactor(0);
    
    this.collectSound = this.sound.get('collect') || this.sound.add('collect', { volume: 0.5 });

    if (this.charUrl) {
      this.load.image('player-char', this.charUrl);
      this.load.once('complete', () => {
        this.createPlayer();
        this.setupInput();
        this.subscribeToRoom();
      });
      this.load.start();
    } else {
      this.createDefaultPlayer();
      this.setupInput();
      this.subscribeToRoom();
    }

    this.jumpTouchZone = this.add.zone(0, 0, width, height / 2).setOrigin(0).setInteractive();
    this.jumpTouchZone.on('pointerdown', () => {
      if (!this.player) return;
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-600);
      } else if (this.playerBuffs.doubleJump > 0) {
        this.player.setVelocityY(-600);
        this.playerBuffs.doubleJump -= 1;
        this.jumpEmitter?.explode(10, this.player.x, this.player.y);
      }
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(1000, 1850, 'player-char');
    
    if (!this.player.texture.key || this.player.texture.key === '__MISSING') {
      this.player.destroy();
      this.createDefaultPlayer();
      return;
    }

    this.player.setScale(0.5);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.player.setDragX(200);
    this.player.setTint(0xFFFFFF);
    this.setupPlayerCollisions();
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);
  }

  createDefaultPlayer() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF6B6B, 1);
    graphics.fillCircle(0, 10, 25);
    graphics.fillStyle(0xFFE66D, 1);
    graphics.fillCircle(0, -15, 18);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(-5, -18, 2);
    graphics.fillCircle(5, -18, 2);
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
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);
  }

  createCoin(x: number, y: number) {
    const coin = this.physics.add.sprite(x, y, 'asset-coin');
    coin.setScale(0.7);
    coin.setData('value', 1);
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
    this.tweens.add({ targets: item, y: y - 10, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.easeInOut' });
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
        this.playerBuffs.speed = 5000;
        if (this.player) this.speedEmitter?.startFollow(this.player);
        this.speedEmitter?.start();
        this.time.delayedCall(5000, () => { this.speedEmitter?.stop(); });
        break;
      case 'double-jump':
        this.playerBuffs.doubleJump = Math.max(this.playerBuffs.doubleJump, 1);
        if (this.player) this.jumpEmitter?.explode(12, this.player.x, this.player.y);
        break;
      case 'shield':
        this.playerBuffs.shield = 10000;
        if (this.player) this.shieldEmitter?.startFollow(this.player);
        this.shieldEmitter?.start();
        this.time.delayedCall(10000, () => { this.shieldEmitter?.stop(); });
        break;
    }
  }

  setupPlayerCollisions() {
    if (!this.player) return;
    const ground = this.children.getByName('ground') as Phaser.GameObjects.Rectangle;
    if (ground) {
      this.physics.add.collider(this.player, ground);
    }
    if (this.player) {
      this.platforms?.children.entries.forEach((platform) => {
        this.physics.add.collider(this.player!, platform as Phaser.GameObjects.Rectangle);
      });
      this.coins?.children.entries.forEach((coin) => {
        this.physics.add.overlap(this.player!, coin as Phaser.GameObjects.Sprite, (player, coinSprite) => {
          this.collectCoin(coinSprite as Phaser.GameObjects.Sprite);
        });
      });
    }
  }

  setupInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();
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
    const wKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
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
    const value = coin.getData('value') || 1;
    this.score += value;
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }
    const particles = this.add.particles(coin.x, coin.y, 'spark', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      tint: 0xFFE66D,
      lifespan: 500,
      quantity: 5,
    });
    this.time.delayedCall(500, () => { particles.destroy(); });
    this.collectSound?.play();
    coin.destroy();
    this.updatePlayerPosition();
  }

  async updatePlayerPosition() {
    if (!this.player || !this.roomId || !this.supabase) return;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;
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
        .update({ players, updated_at: new Date().toISOString() })
        .eq('id', this.roomId);
    } catch (error) {
      console.error('Error updating player position:', error);
    }
  }

  subscribeToRoom() {
    if (!this.roomId || !this.supabase) return;
    const channel = this.supabase
      .channel(`room:${this.roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${this.roomId}`,
      }, (payload: any) => {
        this.updateOtherPlayers(payload.new.players);
      })
      .subscribe();
    this.events.on('shutdown', async () => {
      if (this.supabase && this.score > 0) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          const { data: userProfile } = await this.supabase
            .from('users')
            .select('preferences')
            .eq('id', user.id)
            .single();
          const currentCoins = userProfile?.preferences?.total_coins || 0;
          const newCoins = currentCoins + this.score;
          await this.supabase
            .from('users')
            .update({ preferences: { ...userProfile?.preferences, total_coins: newCoins } })
            .eq('id', user.id);
        }
      }
      channel.unsubscribe();
    });
  }

  async updateOtherPlayers(players: any[]) {
    if (!this.supabase) return;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;
      const playerCount = players.length;
      if (this.playerCountText) {
        this.playerCountText.setText(`Players: ${playerCount}`);
      }
      // Simplified - just track existing players for now
      // Full implementation would recreate sprites for other players
    } catch (error) {
      console.error('Error updating other players:', error);
    }
  }

  update() {
    if (!this.player || !this.cursors) return;
    const currentSpeed = this.playerBuffs.speed > 0 ? 450 : 300;
    if (this.cursors.left?.isDown || this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown) {
      this.player.setVelocityX(-currentSpeed);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown || this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown) {
      this.player.setVelocityX(currentSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }
    if (this.cursors.up?.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-600);
    }
    if (this.player.y > this.cameras.main.scrollY + this.cameras.main.height + 200) {
      this.resetPlayer();
    }
    if (this.playerBuffs.speed > 0) {
      this.playerBuffs.speed -= this.game.loop.delta;
      if (this.playerBuffs.speed <= 0) this.speedEmitter?.stop();
    }
    if (this.playerBuffs.shield > 0) {
      this.playerBuffs.shield -= this.game.loop.delta;
      if (this.playerBuffs.shield <= 0) this.shieldEmitter?.stop();
    }
    const now = Date.now();
    if (now - this.lastPositionUpdate > 150) {
      this.updatePlayerPosition();
      this.lastPositionUpdate = now;
    }
  }

  resetPlayer() {
    this.player?.setPosition(1000, 1850);
    this.player?.setVelocity(0, 0);
    this.playerBuffs = { speed: 0, doubleJump: 0, shield: 0 };
    this.speedEmitter?.stop();
    this.shieldEmitter?.stop();
  }
}

export default function PlayGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supabase = createClient();

    async function initGame() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login?redirect=/play');
          return;
        }

        const { data: character } = await supabase
          .from('characters')
          .select('image_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const charUrl = character?.image_url || null;
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
          currentRoomId = `${gameType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await supabase.from('game_rooms').insert({
            id: currentRoomId,
            game_type: gameType,
            players: [],
            is_active: true,
          });
        }

        setRoomId(currentRoomId);

        if (canvasRef.current && typeof window !== 'undefined') {
          const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: canvasRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#95E1D3',
            physics: {
              default: 'arcade',
              arcade: { gravity: { x: 0, y: 1200 }, debug: false },
            },
            scene: JumperScene,
            scale: {
              mode: Phaser.Scale.RESIZE,
              autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            callbacks: {
              preBoot: () => ({ charUrl, roomId: currentRoomId, supabase }),
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
          <button onClick={() => router.push('/')} className="btn-primary">Back to Home</button>
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
        <p className="font-nunito text-xs text-gray-600 mt-1">🪙 Collect coins • 🎯 Reach the top!</p>
        {roomId && <p className="font-nunito text-xs text-gray-500 mt-1">Room: {roomId.slice(0, 20)}...</p>}
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

