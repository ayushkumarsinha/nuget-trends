import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Observable, of, throwError } from 'rxjs';

import { PackagesService, PackageInteractionService } from 'src/app/core';
import { SearchInputComponent } from './search-input.component';
import { IPackageSearchResult, PackageSearchResult, IPackageDownloadHistory } from '../../models/package-models';
import { Router } from '@angular/router';
import { MockedRouter } from 'src/app/mocks';

class PackagesServiceMock {

  public static mockedPackageResult: PackageSearchResult[] = [
    new PackageSearchResult('EntityFramework', 500, 'http://go.microsoft.com/fwlink/?LinkID=386613'),
    new PackageSearchResult('System.IdentityModel.Tokens.Jwt', 100, 'some-broken-link'),
    new PackageSearchResult('Microsoft.EntityFrameworkCore.Relational', 100, 'some-broken-link'),
  ];

  public static mockedDownloadHistory: IPackageDownloadHistory = {
    id: 'EntityFramework',
    downloads: [
      { week: new Date('2018-08-12T00:00:00'), count: 48034749 },
      { week: new Date('2018-08-19T00:00:00'), count: 48172816 },
      { week: new Date('2018-08-26T00:00:00'), count: 48474593 },
    ]
  };

  searchPackage$: Observable<PackageSearchResult[]> = of(PackagesServiceMock.mockedPackageResult);
  downloadHistory$: Observable<IPackageDownloadHistory> = of(PackagesServiceMock.mockedDownloadHistory);

  searchPackage(_: string): Observable<IPackageSearchResult[]> {
    return this.searchPackage$;
  }

  getPackageDownloadHistory(): Observable<IPackageDownloadHistory> {
    return this.downloadHistory$;
  }
}

class ToastrMock {
  error(): any {
    return null;
  }
}

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;
  let mockedPackageService: PackagesServiceMock;
  let mockedToastr: ToastrMock;
  let packageInteractionService: PackageInteractionService;
  let router: MockedRouter;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInputComponent],
      imports: [
        FormsModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientModule,
        ToastrModule.forRoot({
          positionClass: 'toast-bottom-right',
          preventDuplicates: true,
        })
      ],
      providers: [
        { provide: PackagesService, useClass: PackagesServiceMock },
        { provide: ToastrService, useClass: ToastrMock },
        { provide: Router, useClass: MockedRouter },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    mockedPackageService = TestBed.get(PackagesService);
    mockedToastr = TestBed.get(ToastrService);
    packageInteractionService = TestBed.get(PackageInteractionService);
    router = TestBed.get(Router);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load packages when typing in the field', fakeAsync(() => {
    fixture.detectChanges();

    // Act
    dispatchMatAutocompleteEvents('entity', component);

    // Assert - Should show all the options
    expect(document.querySelectorAll('.mat-option').length)
      .toBe(PackagesServiceMock.mockedPackageResult.length);
  }));

  it('should show error message in case the search fails', fakeAsync(() => {
    spyOn(mockedPackageService, 'searchPackage').and.callThrough();
    spyOn(mockedToastr, 'error').and.callThrough();

    fixture.detectChanges();

    // Fake the service returning an error
    const response = new HttpResponse({
      body: '{ "error": ""}',
      status: 500
    });
    mockedPackageService.searchPackage$ = throwError(response);

    // Act
    const expectedSearchTerm = 'xunit';
    component.queryField.setValue(expectedSearchTerm);
    tick(300);
    fixture.detectChanges();
    tick(300);

    expect(mockedPackageService.searchPackage).toHaveBeenCalledWith(expectedSearchTerm);
    expect(mockedToastr.error).toHaveBeenCalled();
  }));

  it('should get the download history when selecting a package from the results', fakeAsync(() => {
    spyOn(mockedPackageService, 'getPackageDownloadHistory').and.callThrough();
    spyOn(packageInteractionService, 'addPackage').and.callThrough();
    router.url = '/packages';

    fixture.detectChanges();
    dispatchMatAutocompleteEvents('entity', component);

    const firstOption: any = document.querySelectorAll('.mat-option')[0];
    firstOption.click();
    tick(300);

    expect(mockedPackageService.getPackageDownloadHistory).toHaveBeenCalled();
    expect(packageInteractionService.addPackage).toHaveBeenCalledWith(PackagesServiceMock.mockedDownloadHistory);
  }));

  it('should show error message in case the download history request fails', fakeAsync(() => {
    const response = new HttpResponse({
      body: '{ "error": ""}',
      status: 500
    });
    spyOn(mockedPackageService, 'getPackageDownloadHistory').and.returnValue(throwError(response));
    spyOn(mockedToastr, 'error').and.callThrough();

    fixture.detectChanges();
    dispatchMatAutocompleteEvents('entity', component);

    const firstOption: any = document.querySelectorAll('.mat-option')[0];
    firstOption.click();
    tick(300);

    expect(mockedToastr.error).toHaveBeenCalled();
  }));

  it('should redirect to the chart view when selecting a package from the home page', fakeAsync(() => {
    spyOn(mockedPackageService, 'getPackageDownloadHistory').and.callThrough();
    spyOn(packageInteractionService, 'addPackage').and.callThrough();
    spyOn(router, 'navigate').and.callThrough();

    router.url = '/';

    fixture.detectChanges();
    dispatchMatAutocompleteEvents('entity', component);

    const firstOption: any = document.querySelectorAll('.mat-option')[0];
    firstOption.click();
    tick(300);

    expect(mockedPackageService.getPackageDownloadHistory).toHaveBeenCalled();
    expect(packageInteractionService.addPackage).toHaveBeenCalledWith(PackagesServiceMock.mockedDownloadHistory);
    expect(router.navigate).toHaveBeenCalledWith(['/packages']);
  }));

  function dispatchMatAutocompleteEvents(text: string, sut: SearchInputComponent) {

    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputElement.focus();

    // set the text into the formControl.
    // setting the value in the input does not work for some reason.
    sut.queryField.setValue(text);

    inputElement.dispatchEvent(new Event('focusin'));
    inputElement.dispatchEvent(new Event('input'));

    // Wait for the debounceTime
    tick(300);
    fixture.detectChanges();
    tick();
  }
});
