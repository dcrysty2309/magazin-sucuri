import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { MetaService } from '../../../../core/services/meta.service';

type StageId =
  | 'livada'
  | 'recoltare'
  | 'spalare'
  | 'tocare'
  | 'presare'
  | 'pasteurizare'
  | 'ambalare'
  | 'transport'
  | 'client'
  | 'pahar';

interface ProcessStage {
  id: StageId;
  label: string;
  title: string;
  description: string;
  seoText: string;
}

@Component({
  selector: 'app-processing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './processing-page.component.html',
  styleUrl: './processing-page.component.scss',
})
export class ProcessingPageComponent implements AfterViewInit {
  @ViewChild('sceneHost', { static: true }) private readonly sceneHost?: ElementRef<HTMLDivElement>;
  @ViewChild('viewerSection', { static: true }) private readonly viewerSection?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly metaService = inject(MetaService);

  readonly stages: ProcessStage[] = [
    {
      id: 'livada',
      label: '1',
      title: 'Livada',
      description: 'Totul incepe in livada, acolo unde merele cresc lent si capata gustul care defineste un suc de mere natural premium.',
      seoText: 'Mere romanesti din livada proprie sunt baza pentru un suc natural din mere cu gust autentic.',
    },
    {
      id: 'recoltare',
      label: '2',
      title: 'Recoltare',
      description: 'Fructele bune sunt culese si asezate in lazi, astfel incat materia prima pentru procesare suc de mere sa fie curata si bine organizata.',
      seoText: 'Recoltarea corecta pastreaza calitatea necesara pentru un suc de mere presat bine facut.',
    },
    {
      id: 'spalare',
      label: '3',
      title: 'Spalare',
      description: 'Merele ajung intr-un sistem de spalare unde sunt curatate delicat inainte de prelucrare.',
      seoText: 'Etapa de spalare este esentiala in procesare suc de mere si pregateste fructele pentru transformare.',
    },
    {
      id: 'tocare',
      label: '4',
      title: 'Tocare',
      description: 'Fructele sunt tocate controlat pentru a obtine pulpa care va intra in presa.',
      seoText: 'Asa se face sucul de mere: fructul este mai intai tocat, apoi presat pentru a extrage sucul curat.',
    },
    {
      id: 'presare',
      label: '5',
      title: 'Presare',
      description: 'Pulpa este presata pentru a obtine suc de mere presat, cu aroma si caracter cat mai aproape de fructul proaspat.',
      seoText: 'Presarea este nucleul procesului prin care obtinem suc de mere natural, fara adaosuri inutile.',
    },
    {
      id: 'pasteurizare',
      label: '6',
      title: 'Pasteurizare',
      description: 'Sucul trece printr-o pasteurizare delicata pentru siguranta si stabilitate, fara sa piarda identitatea gustului.',
      seoText: 'Pasteurizarea controlata completeaza modul in care se face sucul de mere pentru comercializare sigura.',
    },
    {
      id: 'ambalare',
      label: '7',
      title: 'Ambalare',
      description: 'Sucul este ambalat in Bag-in-Box sau sticla, in functie de formatul potrivit pentru consum acasa sau la birou.',
      seoText: 'Ambalarea premium protejeaza un suc de mere 100% natural si il face usor de transportat.',
    },
    {
      id: 'transport',
      label: '8',
      title: 'Transport',
      description: 'Produsele pleaca spre clienti in conditii sigure, intr-un flux gandit pentru livrare rapida.',
      seoText: 'Dupa procesare suc de mere, logistica bine controlata mentine calitatea pana la destinatie.',
    },
    {
      id: 'client',
      label: '9',
      title: 'Clientul final',
      description: 'Produsul ajunge la client, pregatit pentru consum simplu, curat si fara surprize legate de ingrediente.',
      seoText: 'Clientul primeste un suc de mere romanesc creat cu transparenta si respect pentru ingrediente.',
    },
    {
      id: 'pahar',
      label: '10',
      title: 'Suc in pahar',
      description: 'Etapa finala este cea mai simpla: turnarea in pahar si bucuria unui gust clar, curat si natural.',
      seoText: 'Rezultatul final este un suc de mere natural, fara zahar adaugat si fara conservanti, gata de savurat.',
    },
  ];

  readonly activeIndex = signal(0);
  readonly activeStage = computed(() => this.stages[this.activeIndex()]);
  readonly progress = computed(() => ((this.activeIndex() + 1) / this.stages.length) * 100);
  readonly sceneReady = signal(false);
  readonly sceneError = signal('');

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private animationFrameId?: number;
  private resizeObserver?: ResizeObserver;
  private clock = new THREE.Clock();
  private stageRoot?: THREE.Group;
  private stageAnimation: (elapsed: number) => void = () => {};
  private wheelLockUntil = 0;

  constructor() {
    this.metaService.setPageTitle('Procesare fructe');
    this.metaService.setDescription(
      'Descopera procesarea fructelor, de la livada la pahar, si vezi cum se face sucul de mere natural: spalare, presare, pasteurizare, ambalare si livrare.',
    );
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.sceneHost) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        this.initScene();
        this.animate();
        this.observeResize();
        this.ngZone.run(() => {
          this.sceneReady.set(true);
          this.sceneError.set('');
        });
      } catch {
        this.ngZone.run(() => {
          this.sceneReady.set(false);
          this.sceneError.set('Scena 3D nu a putut fi initializata pe acest dispozitiv.');
        });
      }
    });

    this.destroyRef.onDestroy(() => this.disposeScene());
  }

  previousStage(): void {
    this.goToStage(this.activeIndex() - 1);
  }

  nextStage(): void {
    this.goToStage(this.activeIndex() + 1);
  }

  goToStage(index: number): void {
    const normalizedIndex = Math.max(0, Math.min(index, this.stages.length - 1));
    if (normalizedIndex === this.activeIndex()) {
      return;
    }

    this.activeIndex.set(normalizedIndex);
    this.renderActiveStage();
  }

  @HostListener('window:keydown.arrowright')
  handleArrowRight(): void {
    this.nextStage();
  }

  @HostListener('window:keydown.arrowleft')
  handleArrowLeft(): void {
    this.previousStage();
  }

  onViewerWheel(event: WheelEvent): void {
    if (!this.viewerSection?.nativeElement.contains(event.target as Node)) {
      return;
    }

    const now = performance.now();
    if (now < this.wheelLockUntil) {
      return;
    }

    this.wheelLockUntil = now + 380;
    if (event.deltaY > 0) {
      this.nextStage();
      return;
    }

    this.previousStage();
  }

  private initScene(): void {
    const host = this.sceneHost?.nativeElement;
    if (!host) {
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#eef4ea');

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 4.8, 9.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor('#eef4ea');
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 12;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.target.set(0, 1.35, 0);

    this.addLights();
    this.addEnvironment();
    this.renderActiveStage(true);
    this.resizeScene();
  }

  private addLights(): void {
    if (!this.scene) {
      return;
    }

    const ambient = new THREE.AmbientLight('#fff8ec', 1.7);
    const sun = new THREE.DirectionalLight('#fff0cf', 2.2);
    const rim = new THREE.DirectionalLight('#d8e8c8', 0.8);

    sun.position.set(8, 12, 10);
    rim.position.set(-10, 7, -6);

    this.scene.add(ambient, sun, rim);
  }

  private addEnvironment(): void {
    if (!this.scene) {
      return;
    }

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 40),
      new THREE.MeshStandardMaterial({ color: '#f3e4c8', roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(14, 14, '#c89f59', '#d9c8aa');
    grid.position.y = 0.02;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    this.scene.add(grid);

    for (let index = 0; index < 6; index += 1) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(0.55 + (index % 2) * 0.16, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#fff9ef', roughness: 0.92 }),
      );
      cloud.position.set(-7 + index * 2.8, 7.8 + (index % 2) * 0.4, -6 - (index % 2) * 0.8);
      cloud.scale.set(1.5, 0.72, 1);
      this.scene.add(cloud);
    }
  }

  private renderActiveStage(resetCamera = false): void {
    if (!this.scene) {
      return;
    }

    if (this.stageRoot) {
      this.disposeGroup(this.stageRoot);
      this.scene.remove(this.stageRoot);
    }

    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.55, 0.38, 6),
      new THREE.MeshStandardMaterial({ color: '#d7b984', roughness: 0.92 }),
    );
    base.position.y = 0.19;
    group.add(base);

    const titlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.18, 0.8),
      new THREE.MeshStandardMaterial({ color: '#fff8ee', roughness: 0.8 }),
    );
    titlePlate.position.set(0, 0.42, 1.25);
    group.add(titlePlate);

    const focusRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.08, 16, 48),
      new THREE.MeshStandardMaterial({ color: '#7e9a56', roughness: 0.34, metalness: 0.08 }),
    );
    focusRing.position.set(0, 1.05, 0);
    focusRing.rotation.x = Math.PI / 2;
    group.add(focusRing);

    const focusOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#d8922f', emissive: '#9c5a1d', emissiveIntensity: 0.35, roughness: 0.3 }),
    );
    focusOrb.position.set(0, 1.45, 0);
    group.add(focusOrb);

    const stageAnimation = this.buildStageAnimation(this.activeStage().id, group);
    this.stageAnimation = (elapsed: number) => {
      focusRing.rotation.z = elapsed * 0.55;
      focusOrb.position.y = 1.45 + Math.sin(elapsed * 2.1) * 0.15;
      stageAnimation(elapsed);
    };
    this.stageRoot = group;
    this.scene.add(group);

    if (resetCamera && this.camera && this.controls) {
      this.camera.position.set(0, 4.8, 9.8);
      this.controls.target.set(0, 1.35, 0);
      this.controls.update();
    }
  }

  private buildStageAnimation(stageId: StageId, group: THREE.Group): (elapsed: number) => void {
    switch (stageId) {
      case 'livada':
        return this.buildLivadaStage(group);
      case 'recoltare':
        return this.buildRecoltareStage(group);
      case 'spalare':
        return this.buildSpalareStage(group);
      case 'tocare':
        return this.buildTocareStage(group);
      case 'presare':
        return this.buildPresareStage(group);
      case 'pasteurizare':
        return this.buildPasteurizareStage(group);
      case 'ambalare':
        return this.buildAmbalareStage(group);
      case 'transport':
        return this.buildTransportStage(group);
      case 'client':
        return this.buildClientStage(group);
      case 'pahar':
        return this.buildPaharStage(group);
    }
  }

  private buildLivadaStage(group: THREE.Group): (elapsed: number) => void {
    const appleMeshes: THREE.Mesh[] = [];

    for (let treeIndex = 0; treeIndex < 3; treeIndex += 1) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 1.3, 8),
        new THREE.MeshStandardMaterial({ color: '#8a5a3d', roughness: 1 }),
      );
      trunk.position.set(-1.2 + treeIndex * 1.2, 0.98, -0.2 + (treeIndex % 2) * 0.2);
      group.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 18, 18),
        new THREE.MeshStandardMaterial({ color: '#6e8f4f', roughness: 0.92 }),
      );
      crown.position.set(trunk.position.x, 1.9, trunk.position.z);
      group.add(crown);

      for (let appleIndex = 0; appleIndex < 4; appleIndex += 1) {
        const apple = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 14, 14),
          new THREE.MeshStandardMaterial({ color: '#c84e37', roughness: 0.55 }),
        );
        apple.position.set(
          crown.position.x - 0.24 + appleIndex * 0.14,
          1.72 + (appleIndex % 2) * 0.18,
          crown.position.z + (appleIndex % 3) * 0.12,
        );
        appleMeshes.push(apple);
        group.add(apple);
      }
    }

    return (elapsed) => {
      appleMeshes.forEach((apple, index) => {
        apple.position.y = 1.72 + (index % 2) * 0.18 + Math.sin(elapsed * 1.6 + index) * 0.03;
      });
    };
  }

  private buildRecoltareStage(group: THREE.Group): (elapsed: number) => void {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.9, 1.4),
      new THREE.MeshStandardMaterial({ color: '#b77b4d', roughness: 0.95 }),
    );
    crate.position.set(0, 0.76, 0);
    group.add(crate);

    const apples: THREE.Mesh[] = [];
    for (let index = 0; index < 6; index += 1) {
      const apple = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 16),
        new THREE.MeshStandardMaterial({ color: index % 2 ? '#b83f31' : '#d88b2f', roughness: 0.58 }),
      );
      apple.position.set(-0.45 + (index % 3) * 0.42, 1.18 + Math.floor(index / 3) * 0.12, -0.18 + (index % 2) * 0.2);
      apples.push(apple);
      group.add(apple);
    }

    return (elapsed) => {
      crate.rotation.y = Math.sin(elapsed * 0.8) * 0.06;
      apples.forEach((apple, index) => {
        apple.position.y = 1.16 + Math.sin(elapsed * 2.1 + index) * 0.06;
      });
    };
  }

  private buildSpalareStage(group: THREE.Group): (elapsed: number) => void {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 1.02, 1.45, 24),
      new THREE.MeshStandardMaterial({ color: '#cfe4ef', roughness: 0.28, metalness: 0.18 }),
    );
    tank.position.set(0, 1.05, 0);
    group.add(tank);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.86, 0.72, 24),
      new THREE.MeshStandardMaterial({ color: '#82c3db', transparent: true, opacity: 0.8 }),
    );
    water.position.set(0, 0.92, 0);
    group.add(water);

    const bubbles: THREE.Mesh[] = [];
    for (let index = 0; index < 5; index += 1) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: '#fffdf9', transparent: true, opacity: 0.8 }),
      );
      bubble.position.set(-0.3 + index * 0.16, 0.7, -0.08 + (index % 2) * 0.18);
      bubbles.push(bubble);
      group.add(bubble);
    }

    return (elapsed) => {
      water.scale.y = 0.94 + Math.sin(elapsed * 2.4) * 0.08;
      bubbles.forEach((bubble, index) => {
        bubble.position.y = 0.7 + ((elapsed * 0.5 + index * 0.12) % 0.8);
      });
    };
  }

  private buildTocareStage(group: THREE.Group): (elapsed: number) => void {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: '#bcc2c8', metalness: 0.26, roughness: 0.52 }),
    );
    body.position.set(0, 1, 0);
    group.add(body);

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.08, 0.22),
      new THREE.MeshStandardMaterial({ color: '#79828c', metalness: 0.42, roughness: 0.3 }),
    );
    blade.position.set(0, 1.04, 0);
    group.add(blade);

    const funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.58, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: '#d6b182', roughness: 0.86 }),
    );
    funnel.position.set(0, 1.84, 0);
    group.add(funnel);

    return (elapsed) => {
      blade.rotation.y = elapsed * 4.8;
    };
  }

  private buildPresareStage(group: THREE.Group): (elapsed: number) => void {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.16, 1.2),
      new THREE.MeshStandardMaterial({ color: '#7c8f69', roughness: 0.8 }),
    );
    frame.position.set(0, 1.95, 0);
    group.add(frame);

    const pillarLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.8, 0.18),
      new THREE.MeshStandardMaterial({ color: '#7c8f69', roughness: 0.8 }),
    );
    pillarLeft.position.set(-0.72, 1.08, 0);
    const pillarRight = pillarLeft.clone();
    pillarRight.position.x = 0.72;
    group.add(pillarLeft, pillarRight);

    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.5, 20),
      new THREE.MeshStandardMaterial({ color: '#d7d9dd', metalness: 0.28, roughness: 0.34 }),
    );
    piston.position.set(0, 1.45, 0);
    group.add(piston);

    const juice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.12, 20),
      new THREE.MeshStandardMaterial({ color: '#d58a2a', roughness: 0.38 }),
    );
    juice.position.set(0, 0.54, 0);
    group.add(juice);

    return (elapsed) => {
      piston.position.y = 1.45 - (Math.sin(elapsed * 2.2) * 0.24 + 0.24);
      juice.scale.y = 1 + (Math.sin(elapsed * 2.2) * 0.2 + 0.22);
    };
  }

  private buildPasteurizareStage(group: THREE.Group): (elapsed: number) => void {
    const tank = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 1.5, 8, 18),
      new THREE.MeshStandardMaterial({ color: '#d4d9de', metalness: 0.24, roughness: 0.38 }),
    );
    tank.position.set(0, 1.3, 0);
    tank.rotation.z = Math.PI / 2;
    group.add(tank);

    const heatRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.08, 12, 40),
      new THREE.MeshStandardMaterial({ color: '#df8b3c', emissive: '#9a4f1b', emissiveIntensity: 0.3 }),
    );
    heatRing.position.set(0, 1.3, 0);
    heatRing.rotation.x = Math.PI / 2;
    group.add(heatRing);

    return (elapsed) => {
      heatRing.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.08);
      (heatRing.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55;
    };
  }

  private buildAmbalareStage(group: THREE.Group): (elapsed: number) => void {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.2, 0.8),
      new THREE.MeshStandardMaterial({ color: '#efe2c4', roughness: 0.72 }),
    );
    bag.position.set(-0.52, 1, 0);
    group.add(bag);

    const bagTap = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.34),
      new THREE.MeshStandardMaterial({ color: '#c45e32', roughness: 0.42 }),
    );
    bagTap.position.set(-0.52, 0.72, 0.54);
    group.add(bagTap);

    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.3, 1.45, 18),
      new THREE.MeshStandardMaterial({ color: '#8db377', transparent: true, opacity: 0.92 }),
    );
    bottle.position.set(0.82, 1.05, 0);
    group.add(bottle);

    const juice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.23, 0.84, 18),
      new THREE.MeshStandardMaterial({ color: '#d48d27', transparent: true, opacity: 0.82 }),
    );
    juice.position.set(0.82, 0.84, 0);
    group.add(juice);

    return (elapsed) => {
      bag.rotation.y = Math.sin(elapsed * 1.3) * 0.08;
      bottle.position.y = 1.05 + Math.sin(elapsed * 1.9) * 0.08;
    };
  }

  private buildTransportStage(group: THREE.Group): (elapsed: number) => void {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.88, 1.1),
      new THREE.MeshStandardMaterial({ color: '#d1e1c5', roughness: 0.58 }),
    );
    body.position.set(0.1, 1, 0);
    group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 1),
      new THREE.MeshStandardMaterial({ color: '#7f9863', roughness: 0.58 }),
    );
    cabin.position.set(-0.92, 1.12, 0);
    group.add(cabin);

    const wheels = [-0.7, 0.55].map((x) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.18, 18),
        new THREE.MeshStandardMaterial({ color: '#3e3e3e', roughness: 0.88 }),
      );
      wheel.position.set(x, 0.45, 0.55);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);

      const mirrorWheel = wheel.clone();
      mirrorWheel.position.z = -0.55;
      group.add(mirrorWheel);
      return [wheel, mirrorWheel];
    }).flat();

    return (elapsed) => {
      group.position.z = Math.sin(elapsed * 1.5) * 0.2;
      wheels.forEach((wheel) => {
        wheel.rotation.x = elapsed * 5;
      });
    };
  }

  private buildClientStage(group: THREE.Group): (elapsed: number) => void {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 1.2, 6, 16),
      new THREE.MeshStandardMaterial({ color: '#c5a17e', roughness: 0.92 }),
    );
    body.position.set(0, 1.16, 0);
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 18),
      new THREE.MeshStandardMaterial({ color: '#f2cfaf', roughness: 0.9 }),
    );
    head.position.set(0, 2.1, 0);
    group.add(head);

    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.9, 0.54),
      new THREE.MeshStandardMaterial({ color: '#efe2c4', roughness: 0.82 }),
    );
    pack.position.set(0.74, 1.18, 0);
    group.add(pack);

    return (elapsed) => {
      head.rotation.y = Math.sin(elapsed * 1.4) * 0.28;
      pack.position.y = 1.18 + Math.sin(elapsed * 2.1) * 0.08;
    };
  }

  private buildPaharStage(group: THREE.Group): (elapsed: number) => void {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.48, 1.3, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: '#fdfbf7', transparent: true, opacity: 0.46, roughness: 0.08 }),
    );
    glass.position.set(0, 1.06, 0);
    group.add(glass);

    const juice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: '#d5952f', roughness: 0.36 }),
    );
    juice.position.set(0, 0.62, 0);
    group.add(juice);

    const stream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: '#dda14b', transparent: true, opacity: 0.86 }),
    );
    stream.position.set(-0.5, 1.9, 0);
    stream.rotation.z = 0.34;
    group.add(stream);

    return (elapsed) => {
      juice.scale.y = 0.85 + (Math.sin(elapsed * 2.4) * 0.24 + 0.26);
      juice.position.y = 0.62 + (juice.scale.y - 1) * 0.14;
      stream.scale.y = 1;
      (stream.material as THREE.MeshStandardMaterial).opacity = 0.92;
    };
  }

  private animate = (): void => {
    if (!this.scene || !this.camera || !this.renderer || !this.controls) {
      return;
    }

    const elapsed = this.clock.getElapsedTime();
    this.controls.update();
    this.stageAnimation(elapsed);
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = window.requestAnimationFrame(this.animate);
  };

  private observeResize(): void {
    if (!this.sceneHost?.nativeElement || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', this.resizeScene);
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', this.resizeScene));
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.resizeScene());
    this.resizeObserver.observe(this.sceneHost.nativeElement);
  }

  private resizeScene = (): void => {
    const host = this.sceneHost?.nativeElement;
    if (!host || !this.camera || !this.renderer) {
      return;
    }

    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private disposeScene(): void {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.renderer?.dispose();

    if (this.scene) {
      this.scene.traverse((object: THREE.Object3D) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material: THREE.Material) => material.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
    }

    this.renderer?.domElement.remove();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: THREE.Material) => material.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
  }
}
