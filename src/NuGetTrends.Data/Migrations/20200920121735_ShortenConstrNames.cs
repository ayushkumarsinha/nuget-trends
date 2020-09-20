using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace NuGetTrends.Data.Migrations
{
    public partial class ShortenConstrNames : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE package_dependency RENAME CONSTRAINT fk_package_dependency_package_dependency_group_package_dependen TO fk_package_dependency_package_dependency_group_id;");

            migrationBuilder.Sql("ALTER TABLE package_dependency_group RENAME CONSTRAINT fk_package_dependency_group_package_details_catalog_leafs_packa TO fk_package_dependency_group_package_details_catalog_leafs_id;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE package_dependency RENAME CONSTRAINT fk_package_dependency_package_dependency_group_id TO fk_package_dependency_package_dependency_group_package_dependen;");

            migrationBuilder.Sql("ALTER TABLE package_dependency_group RENAME CONSTRAINT fk_package_dependency_group_package_details_catalog_leafs_id TO fk_package_dependency_group_package_details_catalog_leafs_packa;");
        }
    }
}
