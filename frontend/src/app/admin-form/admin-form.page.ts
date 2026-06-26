import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent,  
  IonButton 
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { MusicService } from '../services/music.service';
import { SearchBarComponent } from '../components/shared/search-bar/search-bar.component';

@Component({
  selector: 'app-admin-form',
  templateUrl: './admin-form.page.html',
  styleUrl: './admin-form.page.scss',
  standalone: true,
  imports: [
    IonContent, 
    CommonModule, 
    FormsModule, 
    IonButton, 
    SearchBarComponent
  ]
})
export class AdminFormPage implements OnInit {
  type!: 'artist' | 'radio' | 'merchandising' | 'ticket';
  action!: string;
  
  labels: any = {
    type: { 
      artist: 'Artista', 
      radio: 'Radio', 
      merchandising: 'Merchandising', 
      ticket: 'Ticket' 
    },
    action: { 
      add: 'Aggiungi', 
      edit: 'Modifica', 
      delete: 'Elimina' 
    }
  };

  selectedFiles: { [key: string]: File } = {};
  preview: { [key: string]: string } = {};
  form: any = {};
  originalForm!: any;
  selectedItemToEdit: any = null;
  selectedItemToDelete: any = null;
  selectedArtistForAdd: any = null;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private musicService: MusicService
  ) {}

  ngOnInit() {
    this.type = this.route.snapshot.paramMap.get('type') as any;
    this.action = this.route.snapshot.paramMap.get('action')!;
    this.initForm();
  }

  initForm() {
    this.form = this.action === 'add' ? this.getEmptyForm() : {};
  }

  getEmptyForm() {
    switch (this.type) {
      case 'artist': 
        return { name: '', image: '', description: '', biography: '', awards: '', politica: '', genre: '', decade: '', titleimg: '' };
      case 'radio': 
        return { name: '', image: '', titleimg: '', description: '', hometown: '', decade: '', biography: '', politica: '', awards: '' };
      case 'merchandising': 
        return { artistId: null, name: '', image: '', price: null, stock: null, description: '' };
      case 'ticket': 
        return { id_artista: null, type: '', event_name: '', place: '', price: null, date: '' };
      default: 
        return {};
    }
  }

  onFileSelected(event: any, key: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Formato file non supportato. Carica solo immagini.';
      return;
    }

    this.selectedFiles[key] = file;
    const reader = new FileReader();

    reader.onload = () => { 
      this.preview[key] = reader.result as string; 
    };
    reader.readAsDataURL(file);
  }

  onArtistSelectForAdd(artist: any) {
    this.selectedArtistForAdd = artist;

    if (this.type === 'merchandising') 
      this.form.artistId = artist.id;
    else 
      if (this.type === 'ticket') 
        this.form.id_artista = artist.id;
  }

  areAllFieldsFilled(): boolean {
    for (const key of Object.keys(this.form)) {
      if (['id', 'artist_id', 'id_artista', 'artistId', 'likeCount'].includes(key)) {
        continue;
      }
      
      const val = this.form[key];
      if (val === null || val === undefined || String(val).trim() === '') {
        if (key === 'image' || key === 'titleimg') {
          if (!this.selectedFiles[key]) 
            return false;
        } else {
          return false;
        }
      }
    }

    if (this.action === 'add' && (this.type === 'merchandising' || this.type === 'ticket')) {
      if (!this.selectedArtistForAdd) 
        return false;
    }

    return true;
  }

  submit() {
    this.errorMessage = '';

    if ((this.type === 'merchandising' || this.type === 'ticket') && this.form.price <= 0) {
        this.errorMessage = 'Il prezzo non può essere minore o uguale a 0.';
      return;
    }

    if (this.type === 'merchandising' && this.form.stock !== null && this.form.stock !== undefined && this.form.stock < 0) {
      this.errorMessage = 'Lo stock non può essere minore di 0.';
      return;
    }

    if (this.type === 'ticket' && this.form.date) {
      const selectedDate = new Date(this.form.date);
      const currentDate = new Date();

      currentDate.setHours(0, 0, 0, 0); 
      
      if (selectedDate < currentDate) {
          this.errorMessage = 'La data non può essere inferiore a quella corrente';
        return; 
      }
    }
    
    const observer = {
      next: () => this.router.navigate(['/admin-panel']),
      error: (err: any) => {
        this.errorMessage = err.error?.message || "Errore durante l'operazione.";
      }
    };

    if (this.action === 'add') {
      if (!this.areAllFieldsFilled()) {
        this.errorMessage = 'Compila tutti i campi';
        return;
      }

      const fd = this.createFormData();
      
      if (this.type === 'artist') this.musicService.createArtist(fd).subscribe(observer);
      else if (this.type === 'radio') this.musicService.createRadio(fd).subscribe(observer);
      else if (this.type === 'merchandising') this.musicService.createMerch(fd).subscribe(observer);
      else if (this.type === 'ticket') this.musicService.createTicket(this.form).subscribe(observer);
      
    } else if (this.action === 'edit') {
      const changes: any = {};
      Object.keys(this.form).forEach(k => {
        if (!['id', 'ID', 'artist_id', 'id_artista', 'artistId', 'image', 'titleimg', 'likeCount'].includes(k)) {
          if (this.form[k] !== this.originalForm[k]) {
            changes[k] = this.form[k];
          }
        }
      });

      const hasFileChanges = Object.keys(this.selectedFiles).length > 0;
      
      if (Object.keys(changes).length === 0 && !hasFileChanges) {
        this.errorMessage = "Nessun campo modificato";
        return;
      }

      const fd = new FormData();
      Object.keys(changes).forEach(k => {
        if (changes[k] !== null && changes[k] !== undefined) {
          fd.append(k, changes[k]);
        }
      });
      
      if (this.selectedFiles['image']) fd.append('image', this.selectedFiles['image']);
      if (this.selectedFiles['titleimg']) fd.append('titleimg', this.selectedFiles['titleimg']);

      let update$;
      const idToEdit = this.selectedItemToEdit.id;

      if (this.type === 'artist') update$ = this.musicService.updateArtist(idToEdit, fd);
      else if (this.type === 'radio') update$ = this.musicService.updateRadio(idToEdit, fd);
      else if (this.type === 'merchandising') update$ = this.musicService.updateMerch(idToEdit, fd);
      else if (this.type === 'ticket') update$ = this.musicService.updateTicket(idToEdit, changes);

      update$?.subscribe(observer);
      
    } else if (this.action === 'delete') {
      const idToDelete = this.selectedItemToDelete.id;
      
      if (this.type === 'artist') this.musicService.deleteArtist(idToDelete).subscribe(observer);
      else if (this.type === 'radio') this.musicService.deleteRadio(idToDelete).subscribe(observer);
      else if (this.type === 'merchandising') this.musicService.deleteMerch(idToDelete).subscribe(observer);
      else if (this.type === 'ticket') this.musicService.deleteTicket(idToDelete).subscribe(observer);
    }
  }

  createFormData(): FormData {
    const fd = new FormData();
    Object.keys(this.form).forEach(k => {
      if (!['image', 'titleimg'].includes(k)) {
        if (this.form[k] !== null && this.form[k] !== undefined && String(this.form[k]).trim() !== '') {
          fd.append(k, this.form[k]);
        }
      }
    });
    
    if (this.selectedFiles['image']) fd.append('image', this.selectedFiles['image']);
    if (this.selectedFiles['titleimg']) fd.append('titleimg', this.selectedFiles['titleimg']);
    
    return fd;
  }

  onSelectEdit(item: any) {
    const fixedUrlItem = { ...item };

    if (fixedUrlItem.image) 
      fixedUrlItem.image = this.musicService.fixUrl(fixedUrlItem.image);
    
    if (fixedUrlItem.titleimg) 
      fixedUrlItem.titleimg = this.musicService.fixUrl(fixedUrlItem.titleimg);

    this.selectedItemToEdit = fixedUrlItem;
    this.form = JSON.parse(JSON.stringify(fixedUrlItem));
    
    this.originalForm = JSON.parse(JSON.stringify(fixedUrlItem));
    this.preview = {};
  }

  getImageSource(key: string): string | null {
    if (this.preview[key]) {
      return this.preview[key];
    }
    if (this.form[key]) {
      return this.form[key];
    }
    return null;
  }

  cancel() { 
    this.router.navigate(['/admin-panel']); 
  }
  
  onSelectDelete(item: any) { 
    this.selectedItemToDelete = item; 
    this.form = JSON.parse(JSON.stringify(item)); 
  }
}